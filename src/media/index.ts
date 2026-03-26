import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AttachmentType, MediaStrategy } from '../types.js';
import type {
  MediaManifest,
  MediaOptions,
  NormalizedAttachment,
  NormalizedEmbed,
  NormalizedEmbedMedia,
  NormalizedMessage,
  NormalizedSticker,
  TranscriptOptions,
} from '../types.js';
import { AssetDownloader } from './downloader.js';
import { tryCompress } from './optimizer.js';
import { ManifestBuilder, makeManifestEntry } from './manifest.js';

// ─── Inline (base64) helpers ──────────────────────────────────────────────────

async function toBase64DataUri(filePath: string, contentType: string | null): Promise<string> {
  const buf = await readFile(filePath);
  const mime = contentType ?? 'application/octet-stream';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// ─── MediaManager ─────────────────────────────────────────────────────────────

export class MediaManager {
  private downloader: AssetDownloader | null = null;
  private manifest = new ManifestBuilder();
  private strategy: string;
  private opts: MediaOptions;
  private transcriptOpts: TranscriptOptions;

  constructor(opts: TranscriptOptions) {
    this.transcriptOpts = opts;
    this.opts = opts.media ?? {};
    this.strategy = this.opts.strategy ?? MediaStrategy.Reference;

    if (
      this.strategy === MediaStrategy.Download ||
      this.strategy === MediaStrategy.Inline
    ) {
      const downloadPath = this.opts.downloadPath ?? join(opts.outputPath ?? '.', 'assets');
      this.downloader = new AssetDownloader({
        downloadPath,
        maxSizeMB: this.opts.maxSizeMB ?? 8,
        concurrency: this.opts.concurrency ?? 3,
        onWarning: opts.onWarning,
      });
    }
  }

  // ─── URL resolution ─────────────────────────────────────────────────────

  private async resolveUrl(
    url: string,
    contentType: string | null,
    type: AttachmentType,
  ): Promise<string> {
    switch (this.strategy) {
      case MediaStrategy.None:
      case 'none':
        return url; // placeholder text is handled by renderer

      case MediaStrategy.Reference:
      case 'reference':
        return url; // original Discord CDN URL

      case MediaStrategy.Download:
      case 'download': {
        const result = await this.downloader!.download(url);
        if (!result) return url; // fallback to original on failure

        let finalSize = result.sizeBytes;
        let compressed = false;

        if (this.opts.compress) {
          const newSize = await tryCompress(result.localPath, {
            quality: this.opts.compressQuality ?? 80,
          });
          if (newSize !== null) {
            finalSize = newSize;
            compressed = true;
          }
        }

        this.manifest.add(
          makeManifestEntry(url, result.localPath, result.filename, type, finalSize, compressed),
        );

        return result.localPath; // local path — relative reference in HTML
      }

      case MediaStrategy.Inline:
      case 'inline': {
        const result = await this.downloader!.download(url);
        if (!result) return url;

        if (this.opts.compress) {
          await tryCompress(result.localPath, { quality: this.opts.compressQuality ?? 80 });
        }

        return toBase64DataUri(result.localPath, result.contentType ?? contentType);
      }

      default:
        return url;
    }
  }

  // ─── Per-type processors ─────────────────────────────────────────────────

  private async processAttachment(att: NormalizedAttachment): Promise<NormalizedAttachment> {
    // Skip types the user opted out of
    const include = this.transcriptOpts.include ?? {};
    if (att.type === AttachmentType.Image && include.images === false) return att;
    if (att.type === AttachmentType.Video && include.videos === false) return att;
    if (
      (att.type === AttachmentType.File || att.type === AttachmentType.Audio) &&
      include.files === false
    ) return att;

    const resolvedUrl = await this.resolveUrl(att.url, att.contentType, att.type);
    return { ...att, resolvedUrl };
  }

  private async processEmbedMedia(
    media: NormalizedEmbedMedia | null,
    type: AttachmentType,
  ): Promise<NormalizedEmbedMedia | null> {
    if (!media) return null;
    const resolvedUrl = await this.resolveUrl(media.url, null, type);
    return { ...media, resolvedUrl };
  }

  private async processEmbed(embed: NormalizedEmbed): Promise<NormalizedEmbed> {
    const [thumbnail, image, video] = await Promise.all([
      this.processEmbedMedia(embed.thumbnail, AttachmentType.Image),
      this.processEmbedMedia(embed.image, AttachmentType.Image),
      this.processEmbedMedia(embed.video, AttachmentType.Video),
    ]);
    return { ...embed, thumbnail, image, video };
  }

  private async processSticker(sticker: NormalizedSticker): Promise<NormalizedSticker> {
    if (this.transcriptOpts.include?.stickers === false) return sticker;
    const resolvedUrl = await this.resolveUrl(sticker.url, 'image/png', AttachmentType.Image);
    return { ...sticker, resolvedUrl };
  }

  // ─── Public: process a batch of messages ─────────────────────────────────

  async processBatch(messages: NormalizedMessage[]): Promise<NormalizedMessage[]> {
    return Promise.all(messages.map((msg) => this.processMessage(msg)));
  }

  private async processMessage(msg: NormalizedMessage): Promise<NormalizedMessage> {
    // Process all media in parallel within a single message
    const [attachments, embeds, stickers] = await Promise.all([
      Promise.all(msg.attachments.map((a) => this.processAttachment(a))),
      this.transcriptOpts.include?.embeds !== false
        ? Promise.all(msg.embeds.map((e) => this.processEmbed(e)))
        : Promise.resolve(msg.embeds),
      this.transcriptOpts.include?.stickers !== false
        ? Promise.all(msg.stickers.map((s) => this.processSticker(s)))
        : Promise.resolve(msg.stickers),
    ]);

    return { ...msg, attachments, embeds, stickers };
  }

  // ─── Wrap an async iterable with media resolution ─────────────────────

  async *wrap(
    source: AsyncIterable<NormalizedMessage[]>,
  ): AsyncIterable<NormalizedMessage[]> {
    for await (const batch of source) {
      yield await this.processBatch(batch);
    }
  }

  // ─── Finalize: write manifest + optional ZIP ──────────────────────────

  async finalize(): Promise<MediaManifest | null> {
    if (
      this.strategy !== MediaStrategy.Download &&
      this.strategy !== 'download'
    ) {
      return null;
    }

    const downloadPath = this.opts.downloadPath ?? join(this.transcriptOpts.outputPath ?? '.', 'assets');
    await this.manifest.writeToDir(downloadPath);

    if (this.opts.zip) {
      await this.zipAssets(downloadPath);
    }

    return this.manifest.build();
  }

  private async zipAssets(sourcePath: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let archiverMod: any;
    try {
      archiverMod = await import('archiver');
    } catch {
      this.transcriptOpts.onWarning?.(
        new Error('ZIP requested but "archiver" package is not installed. Run: bun add archiver'),
        'MediaManager.zipAssets',
      );
      return;
    }

    const { createWriteStream } = await import('node:fs');
    const zipPath = `${sourcePath}.zip`;
    const output = createWriteStream(zipPath);
    // archiver may be a CJS default export or ESM default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createArchive: any = archiverMod.default ?? archiverMod;
    const archive = createArchive('zip', { zlib: { level: 6 } });

    await new Promise<void>((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(sourcePath, false);
      void archive.finalize();
    });
  }
}
