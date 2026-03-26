import { createWriteStream, mkdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fetch } from 'undici';

export interface DownloadResult {
  localPath: string;
  filename: string;
  sizeBytes: number;
  contentType: string | null;
}

export interface DownloadOptions {
  downloadPath: string;
  maxSizeMB: number;
  concurrency: number;
  onWarning?: ((err: Error, context: string) => void) | undefined;
}

// ─── Filename helpers ─────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 200);
}

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const name = basename(pathname);
    return name ? sanitizeFilename(decodeURIComponent(name)) : 'asset';
  } catch {
    return 'asset';
  }
}

// ─── Concurrency queue (no extra deps) ───────────────────────────────────────

class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.limit) {
      this.running++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.running++;
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// ─── Downloader ───────────────────────────────────────────────────────────────

export class AssetDownloader {
  private sem: Semaphore;
  private usedFilenames = new Map<string, number>(); // base → count for dedup
  private downloadedUrls = new Map<string, DownloadResult>(); // cache

  constructor(private readonly opts: DownloadOptions) {
    this.sem = new Semaphore(opts.concurrency);
    mkdirSync(opts.downloadPath, { recursive: true });
  }

  private uniqueFilename(base: string): string {
    const count = this.usedFilenames.get(base) ?? 0;
    this.usedFilenames.set(base, count + 1);
    if (count === 0) return base;

    const ext = extname(base);
    const stem = base.slice(0, base.length - ext.length);
    return `${stem}-${count}${ext}`;
  }

  /**
   * Downloads a single asset URL to disk with retry logic.
   * Returns the cached result if already downloaded.
   */
  async download(url: string): Promise<DownloadResult | null> {
    // Return cached result for already-downloaded URLs
    const cached = this.downloadedUrls.get(url);
    if (cached) return cached;

    return this.sem.run(() => this.attempt(url, 2));
  }

  private async attempt(url: string, retries: number): Promise<DownloadResult | null> {
    const maxBytes = this.opts.maxSizeMB * 1024 * 1024;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'TranScriptor/1.0 (discord transcript exporter)' },
          signal: AbortSignal.timeout(30_000),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} for ${url}`);
        }

        // Check Content-Length before downloading
        const contentLength = res.headers.get('content-length');
        if (contentLength && parseInt(contentLength, 10) > maxBytes) {
          this.opts.onWarning?.(
            new Error(`Asset too large (${(parseInt(contentLength, 10) / 1024 / 1024).toFixed(1)} MB > ${this.opts.maxSizeMB} MB)`),
            url,
          );
          return null;
        }

        const contentType = res.headers.get('content-type');
        const rawFilename = extractFilename(url);
        const filename = this.uniqueFilename(rawFilename);
        const localPath = join(this.opts.downloadPath, filename);

        // Stream to disk while tracking size
        let sizeBytes = 0;
        const body = res.body;
        if (!body) throw new Error('Empty response body');

        const nodeStream = Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]);
        const writeStream = createWriteStream(localPath);

        // Monitor size during download
        nodeStream.on('data', (chunk: Buffer) => {
          sizeBytes += chunk.length;
          if (sizeBytes > maxBytes) {
            nodeStream.destroy(new Error('Asset exceeded max size during download'));
          }
        });

        await pipeline(nodeStream, writeStream);

        const result: DownloadResult = { localPath, filename, sizeBytes, contentType };
        this.downloadedUrls.set(url, result);
        return result;

      } catch (err) {
        const isLast = attempt === retries;
        if (isLast) {
          this.opts.onWarning?.(
            err instanceof Error ? err : new Error(String(err)),
            `download failed after ${retries + 1} attempts: ${url}`,
          );
          return null;
        }
        // Wait before retrying (exponential backoff)
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }

    return null;
  }
}
