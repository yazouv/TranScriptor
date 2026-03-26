import { Readable, PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { IExporter, NormalizedMessage, TranscriptOptions } from '../types.js';
import { ExportFormat, OutputType } from '../types.js';

// Minimal channel shape needed by exporters
export interface ChannelInfo {
  id: string;
  name: string;
  guild?: { name: string; iconURL?: (opts: object) => string | null };
}

// ─── Format helpers ───────────────────────────────────────────────────────────

// Enum values equal the string literals, so one set is sufficient
const FILE_EXTENSIONS: Record<string, string> = {
  html: 'html',
  markdown: 'md',
  txt: 'txt',
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateISO(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

// ─── BaseExporter ─────────────────────────────────────────────────────────────

export abstract class BaseExporter implements IExporter {
  protected channel: ChannelInfo;
  protected options: TranscriptOptions;
  protected messageCount = 0;

  constructor(channel: ChannelInfo, options: TranscriptOptions) {
    this.channel = channel;
    this.options = options;
  }

  // Subclasses implement these three methods
  protected abstract renderHeader(): string;
  protected abstract renderFooter(): string;
  protected abstract renderMessage(
    msg: NormalizedMessage,
    prev: NormalizedMessage | null,
  ): Promise<string>;

  /**
   * Exports batched messages through a PassThrough stream.
   * Writes header → batches → footer without holding everything in memory.
   */
  export(messages: AsyncIterable<NormalizedMessage[]>): Readable {
    const pass = new PassThrough();

    // Run async pipeline without blocking the caller
    this.run(pass, messages).catch((err: unknown) => {
      pass.destroy(err instanceof Error ? err : new Error(String(err)));
    });

    return pass;
  }

  private async run(
    stream: PassThrough,
    messages: AsyncIterable<NormalizedMessage[]>,
  ): Promise<void> {
    stream.push(this.renderHeader());

    let prev: NormalizedMessage | null = null;

    for await (const batch of messages) {
      for (const msg of batch) {
        const chunk = await this.renderMessage(msg, prev);
        if (chunk) stream.push(chunk);
        prev = msg;
        this.messageCount++;
      }

      this.options.onProgress?.({
        processed: this.messageCount,
        total: null,
        phase: 'exporting',
      });
    }

    stream.push(this.renderFooter());
    stream.push(null); // signal end of stream
  }

  // ─── Output helpers ──────────────────────────────────────────────────────

  /**
   * Collects the export stream into a Buffer.
   */
  async toBuffer(messages: AsyncIterable<NormalizedMessage[]>): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const stream = this.export(messages);
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
    }
    return Buffer.concat(chunks);
  }

  /**
   * Collects the export stream into a string.
   */
  async toString(messages: AsyncIterable<NormalizedMessage[]>): Promise<string> {
    const buf = await this.toBuffer(messages);
    return buf.toString('utf8');
  }

  /**
   * Writes the export stream to a file on disk.
   */
  async toFile(
    messages: AsyncIterable<NormalizedMessage[]>,
    outputPath: string,
    filename?: string,
  ): Promise<string> {
    mkdirSync(outputPath, { recursive: true });

    const ext = FILE_EXTENSIONS[this.options.format] ?? 'txt';
    const name = filename ?? `${this.channel.name}-transcript.${ext}`;
    const filePath = join(outputPath, name);

    const readable = this.export(messages);
    const writable = createWriteStream(filePath);
    await pipeline(readable, writable);

    return filePath;
  }

  // ─── Footer text ─────────────────────────────────────────────────────────

  protected buildFooterText(): string {
    const template =
      this.options.footerText ?? (this.options.poweredBy !== false ? 'Exported {count} messages — TranScriptor' : 'Exported {count} messages');
    return template.replace('{count}', String(this.messageCount));
  }

  // ─── Day separator helper ─────────────────────────────────────────────────

  protected isDifferentDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() !== b.getFullYear() ||
      a.getMonth() !== b.getMonth() ||
      a.getDate() !== b.getDate()
    );
  }
}
