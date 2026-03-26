import type { Readable } from 'node:stream';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ExportFormat {
  HTML = 'html',
  Markdown = 'markdown',
  TXT = 'txt',
}

export enum OutputType {
  Buffer = 'buffer',
  String = 'string',
  Stream = 'stream',
  File = 'file',
}

export enum MediaStrategy {
  /** Original Discord CDN URLs — lightweight, expires in ~14 days */
  Reference = 'reference',
  /** Downloads assets to a local folder */
  Download = 'download',
  /** Embeds assets as base64 data URIs — very large, self-contained */
  Inline = 'inline',
  /** Replaces assets with text placeholders */
  None = 'none',
}

export enum AttachmentType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  File = 'file',
}

export enum MessageType {
  Default = 'default',
  Reply = 'reply',
  System = 'system',
  ThreadCreated = 'thread_created',
  ApplicationCommand = 'application_command',
}

// ─── Public options ───────────────────────────────────────────────────────────

export interface IncludeOptions {
  /** Include images in the export. Default: true */
  images?: boolean;
  /** Include videos in the export. Default: true */
  videos?: boolean;
  /** Include attached files (pdf, zip…). Default: true */
  files?: boolean;
  /** Include reactions. Default: true */
  reactions?: boolean;
  /** Include embeds (rich links, bot embeds…). Default: true */
  embeds?: boolean;
  /** Include stickers. Default: true */
  stickers?: boolean;
  /** Include thread messages. Default: false */
  threads?: boolean;
}

export interface MediaOptions {
  /** Media handling strategy. Default: 'reference' */
  strategy?: MediaStrategy | 'reference' | 'download' | 'inline' | 'none';
  /** Local destination folder when strategy === 'download' */
  downloadPath?: string;
  /** Skip files larger than N MB. Default: 8 */
  maxSizeMB?: number;
  /** Compress images to WebP (requires sharp). Default: false */
  compress?: boolean;
  /** WebP compression quality (1–100). Default: 80 */
  compressQuality?: number;
  /** Maximum number of concurrent downloads. Default: 3 */
  concurrency?: number;
  /** Create a ZIP archive of the assets folder (requires archiver). Default: false */
  zip?: boolean;
}

export interface ProgressEvent {
  processed: number;
  total: number | null;
  phase: 'fetching' | 'processing' | 'exporting' | 'media';
}

export interface TranscriptOptions {
  /** Output format */
  format: ExportFormat | 'html' | 'markdown' | 'txt';
  /** Return type */
  output: OutputType | 'buffer' | 'string' | 'stream' | 'file';
  /** Output folder when output === 'file' */
  outputPath?: string;
  /** Output filename. Default: '{channelName}-transcript.{ext}' */
  filename?: string;

  /** Granular control over included content */
  include?: IncludeOptions;
  /** Media handling configuration */
  media?: MediaOptions;

  /** Number of messages to fetch. -1 = all. Default: -1 */
  limit?: number;
  /** Batch size for processing. Default: 1000 */
  chunkSize?: number;
  /** Custom filter applied before normalization */
  filter?: (msg: RawMessage) => boolean;

  /** Show "Powered by TranScriptor" footer. Default: true */
  poweredBy?: boolean;
  /** Footer text. '{count}' is replaced with the message count. */
  footerText?: string;

  /** Progress callback */
  onProgress?: (event: ProgressEvent) => void;
  /** Non-fatal warning callback (e.g. asset download failure) */
  onWarning?: (error: Error, context: string) => void;
}

// Opaque alias — avoids importing discord.js directly into types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawMessage = any;

// ─── Normalized internal format ───────────────────────────────────────────────

export interface NormalizedUser {
  id: string;
  username: string;
  displayName: string;
  discriminator: string;
  avatarURL: string | null;
  bot: boolean;
  /** Highest role color (hex) */
  roleColor: string | null;
  /** Name of the highest role */
  topRole: string | null;
}

export interface NormalizedAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  /** Resolved URL after media processing (may differ from url) */
  resolvedUrl: string;
  filename: string;
  /** Size in bytes */
  size: number;
  contentType: string | null;
  width: number | null;
  height: number | null;
  /** True if filename starts with SPOILER_ */
  spoiler: boolean;
}

export interface NormalizedEmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface NormalizedEmbedMedia {
  url: string;
  resolvedUrl: string;
  width: number | null;
  height: number | null;
}

export interface NormalizedEmbed {
  type: string;
  title: string | null;
  description: string | null;
  url: string | null;
  color: number | null;
  timestamp: Date | null;
  fields: NormalizedEmbedField[];
  author: { name: string; iconURL: string | null; url: string | null } | null;
  footer: { text: string; iconURL: string | null } | null;
  thumbnail: NormalizedEmbedMedia | null;
  image: NormalizedEmbedMedia | null;
  video: NormalizedEmbedMedia | null;
}

export interface NormalizedReaction {
  emoji: string;
  /** URL if custom emoji, null if unicode emoji */
  emojiURL: string | null;
  count: number;
  animated: boolean;
}

export interface NormalizedSticker {
  id: string;
  name: string;
  url: string;
  resolvedUrl: string;
}

export interface NormalizedMessage {
  id: string;
  type: MessageType;
  author: NormalizedUser;
  content: string;
  /** Content parsed to HTML (null until passed through the renderer) */
  contentHTML: string | null;
  timestamp: Date;
  editedTimestamp: Date | null;
  attachments: NormalizedAttachment[];
  embeds: NormalizedEmbed[];
  reactions: NormalizedReaction[];
  stickers: NormalizedSticker[];
  /** Message this one is replying to */
  replyTo: NormalizedMessage | null;
  pinned: boolean;
  threadId: string | null;
  /** Discord components (buttons, menus…) — stored as-is */
  components: unknown[];
  /** For system messages: human-readable generated text */
  systemContent: string | null;
}

// ─── Export results ───────────────────────────────────────────────────────────

export interface MediaManifestEntry {
  originalUrl: string;
  localPath: string;
  filename: string;
  type: AttachmentType;
  sizeBytes: number;
  compressed: boolean;
}

export interface MediaManifest {
  exportedAt: string;
  totalAssets: number;
  totalSizeBytes: number;
  entries: MediaManifestEntry[];
}

export interface ExportResult {
  /** Transcript data (depends on output type) */
  data: Buffer | string | Readable | null;
  /** File path when output === 'file' */
  filePath: string | null;
  /** Asset manifest when strategy === 'download' */
  manifest: MediaManifest | null;
  /** Total number of exported messages */
  messageCount: number;
  /** Export duration in milliseconds */
  durationMs: number;
}

// ─── Exporter interface ───────────────────────────────────────────────────────

export interface IExporter {
  /**
   * Exports a stream of normalized message batches.
   * Returns a Readable stream of the final content.
   */
  export(messages: AsyncIterable<NormalizedMessage[]>): Readable;
}
