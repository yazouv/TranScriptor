import type { Readable } from 'node:stream';
import { fetchMessages } from './fetcher/index.js';
import { chunk } from './fetcher/chunker.js';
import { normalizeMessage } from './processors/message.js';
import { MediaManager } from './media/index.js';
import type {
  ExportResult,
  NormalizedMessage,
  RawMessage,
  TranscriptOptions,
} from './types.js';
import { ExportFormat, OutputType, MediaStrategy } from './types.js';

// Minimal channel interface — compatible with discord.js v14 and v15
export interface TextChannel {
  messages: {
    fetch(options: { limit: number; before?: string }): Promise<Map<string, RawMessage>>;
  };
  name: string;
  id: string;
  guild?: { name: string; iconURL?: (opts: object) => string | null };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  format: ExportFormat.HTML,
  output: OutputType.Buffer,
  limit: -1,
  chunkSize: 1000,
  poweredBy: true,
} satisfies Partial<TranscriptOptions>;

function withDefaults(options: TranscriptOptions): TranscriptOptions {
  return { ...DEFAULTS, ...options };
}

// ─── Exporter loader (lazy) ───────────────────────────────────────────────────

async function loadExporter(format: string) {
  switch (format) {
    case ExportFormat.HTML:
    case 'html': {
      const { HtmlExporter } = await import('./exporters/html/index.js');
      return HtmlExporter;
    }
    case ExportFormat.Markdown:
    case 'markdown': {
      const { MarkdownExporter } = await import('./exporters/markdown/index.js');
      return MarkdownExporter;
    }
    case ExportFormat.TXT:
    case 'txt': {
      const { TxtExporter } = await import('./exporters/txt/index.js');
      return TxtExporter;
    }
    default:
      throw new Error(`Unknown export format: "${format}"`);
  }
}

// ─── Extension helper ─────────────────────────────────────────────────────────

const EXT: Record<string, string> = { html: 'html', markdown: 'md', txt: 'txt' };

function resolveFilename(channel: TextChannel, options: TranscriptOptions): string {
  if (options.filename) return options.filename;
  const ext = EXT[options.format as string] ?? 'txt';
  return `${channel.name}-transcript.${ext}`;
}

// ─── Core pipeline ────────────────────────────────────────────────────────────

async function runPipeline(
  rawMessages: AsyncIterable<RawMessage>,
  channel: TextChannel,
  options: TranscriptOptions,
): Promise<ExportResult> {
  const start = Date.now();
  const opts = withDefaults(options);
  const { chunkSize, include, onProgress } = opts;

  // Build a lookup map for reply resolution (only needs already-seen messages)
  const messageMap = new Map<string, NormalizedMessage>();

  async function* normalizeStream(): AsyncIterable<NormalizedMessage[]> {
    let processed = 0;

    for await (const batch of chunk(rawMessages, chunkSize ?? 1000)) {
      const normalized: NormalizedMessage[] = [];

      for (const raw of batch) {
        const replyTo =
          raw.reference?.messageId ? (messageMap.get(raw.reference.messageId) ?? null) : null;

        const msg = normalizeMessage(raw, replyTo);

        // Apply include filters
        if (include?.reactions === false) msg.reactions = [];
        if (include?.embeds === false) msg.embeds = [];
        if (include?.stickers === false) msg.stickers = [];
        if (include) {
          msg.attachments = msg.attachments.filter((att) => {
            if (att.type === 'image' && include.images === false) return false;
            if (att.type === 'video' && include.videos === false) return false;
            if ((att.type === 'audio' || att.type === 'file') && include.files === false) return false;
            return true;
          });
        }

        messageMap.set(msg.id, msg);
        normalized.push(msg);
      }

      processed += normalized.length;
      onProgress?.({ processed, total: null, phase: 'processing' });

      yield normalized;
    }
  }

  // Media resolution layer (wraps the normalized stream)
  const media = new MediaManager(opts);
  const processedStream = media.wrap(normalizeStream());

  // Load and run the exporter
  const Exporter = await loadExporter(opts.format as string);
  const exporter = new Exporter(channel, opts);

  // Collect output according to the requested output type
  let data: Buffer | string | Readable | null = null;
  let filePath: string | null = null;

  const outputType = opts.output as string;

  if (outputType === OutputType.Stream || outputType === 'stream') {
    data = exporter.export(processedStream);
  } else if (outputType === OutputType.String || outputType === 'string') {
    data = await exporter.toString(processedStream);
  } else if (outputType === OutputType.File || outputType === 'file') {
    if (!opts.outputPath) {
      throw new Error('outputPath is required when output === "file"');
    }
    filePath = await exporter.toFile(
      processedStream,
      opts.outputPath,
      resolveFilename(channel, opts),
    );
    data = null;
  } else {
    // Default: buffer
    data = await exporter.toBuffer(processedStream);
  }

  // Finalize media (write manifest, optional ZIP)
  const manifest = await media.finalize();

  return {
    data,
    filePath,
    manifest,
    messageCount: exporter['messageCount'] as number,
    durationMs: Date.now() - start,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches all messages from a Discord channel and exports them as a transcript.
 *
 * @example
 * const result = await createTranscript(channel, { format: 'html', output: 'buffer' });
 * fs.writeFileSync('transcript.html', result.data as Buffer);
 */
export async function createTranscript(
  channel: TextChannel,
  options: TranscriptOptions,
): Promise<ExportResult> {
  const opts = withDefaults(options);
  const rawStream = fetchMessages(channel, opts);
  return runPipeline(rawStream, channel, opts);
}

/**
 * Generates a transcript from an already-fetched collection of messages.
 * Accepts a plain array or a discord.js Collection (Map-like).
 *
 * @example
 * const result = await generateFromMessages(messages, channel, { format: 'markdown', output: 'string' });
 */
export async function generateFromMessages(
  messages: RawMessage[] | Map<string, RawMessage>,
  channel: TextChannel,
  options: TranscriptOptions,
): Promise<ExportResult> {
  const opts = withDefaults(options);

  const arr: RawMessage[] = Array.isArray(messages)
    ? [...messages]
    : [...messages.values()];

  // Ensure chronological order by snowflake ID
  arr.sort((a, b) => Number(BigInt(a.id) - BigInt(b.id)));

  async function* rawStream(): AsyncIterable<RawMessage> {
    yield* arr;
  }

  return runPipeline(rawStream(), channel, opts);
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { ExportFormat, OutputType, MediaStrategy };
export type {
  TranscriptOptions,
  IncludeOptions,
  MediaOptions,
  NormalizedMessage,
  NormalizedAttachment,
  NormalizedEmbed,
  NormalizedUser,
  NormalizedReaction,
  ExportResult,
  MediaManifest,
  ProgressEvent,
} from './types.js';
