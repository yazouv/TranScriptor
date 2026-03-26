import { describe, it, expect } from 'vitest';
import { TxtExporter } from '../src/exporters/txt/index.js';
import { MarkdownExporter } from '../src/exporters/markdown/index.js';
import { HtmlExporter } from '../src/exporters/html/index.js';
import { ExportFormat, OutputType } from '../src/types.js';
import type { TranscriptOptions } from '../src/types.js';
import {
  ALL_MESSAGES,
  MSG_PLAIN,
  MSG_CONTINUATION,
  MSG_WITH_IMAGE,
  MSG_WITH_SPOILER_IMAGE,
  MSG_WITH_REACTIONS,
  MSG_WITH_EMBED,
  MSG_SYSTEM_JOIN,
  MSG_WITH_FILE,
  TEST_CHANNEL,
} from './fixtures/messages.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_OPTS: TranscriptOptions = {
  format: ExportFormat.TXT,
  output: OutputType.String,
  media: { strategy: 'reference' },
};

async function exportAll(
  ExporterClass: typeof TxtExporter | typeof MarkdownExporter | typeof HtmlExporter,
  opts: TranscriptOptions,
): Promise<string> {
  const exporter = new ExporterClass(TEST_CHANNEL, opts);
  return exporter.toString(async function* () { yield ALL_MESSAGES; }());
}

// ─── TXT exporter ─────────────────────────────────────────────────────────────

describe('TxtExporter', () => {
  it('includes channel name in header', async () => {
    const out = await exportAll(TxtExporter, { ...BASE_OPTS, format: ExportFormat.TXT });
    expect(out).toContain('#general');
    expect(out).toContain('Test Server');
  });

  it('formats messages with author and timestamp', async () => {
    const out = await exportAll(TxtExporter, { ...BASE_OPTS, format: ExportFormat.TXT });
    expect(out).toContain('Alice');
    expect(out).toContain('Hello, world!');
  });

  it('renders system messages', async () => {
    const out = await exportAll(TxtExporter, { ...BASE_OPTS, format: ExportFormat.TXT });
    expect(out).toContain('joined the server');
  });

  it('renders attachment placeholder when strategy is none', async () => {
    const exporter = new TxtExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.TXT,
      media: { strategy: 'none' },
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_IMAGE]; }());
    expect(out).toContain('[IMAGE:');
    expect(out).not.toContain('http');
  });

  it('renders attachment URL when strategy is reference', async () => {
    const exporter = new TxtExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.TXT,
      media: { strategy: 'reference' },
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_IMAGE]; }());
    expect(out).toContain('cdn.discordapp.com');
  });

  it('omits reactions when include.reactions is false', async () => {
    const exporter = new TxtExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.TXT,
      include: { reactions: false },
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_REACTIONS]; }());
    expect(out).not.toContain('Reactions:');
  });

  it('includes reactions by default', async () => {
    const exporter = new TxtExporter(TEST_CHANNEL, { ...BASE_OPTS, format: ExportFormat.TXT });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_REACTIONS]; }());
    expect(out).toContain('Reactions:');
    expect(out).toContain('👍');
  });

  it('includes footer text', async () => {
    const out = await exportAll(TxtExporter, {
      ...BASE_OPTS,
      format: ExportFormat.TXT,
      footerText: 'Exported {count} messages',
    });
    expect(out).toMatch(/Exported \d+ messages/);
  });

  it('renders day separator when messages span multiple days', async () => {
    const out = await exportAll(TxtExporter, { ...BASE_OPTS, format: ExportFormat.TXT });
    // ALL_MESSAGES contains messages on Jun 15 and Jun 16
    expect(out).toContain('June 15');
    expect(out).toContain('June 16');
  });
});

// ─── Markdown exporter ────────────────────────────────────────────────────────

describe('MarkdownExporter', () => {
  it('produces valid markdown header', async () => {
    const out = await exportAll(MarkdownExporter, { ...BASE_OPTS, format: ExportFormat.Markdown });
    expect(out).toMatch(/^# #general/);
    expect(out).toContain('Test Server');
  });

  it('renders image as markdown image syntax', async () => {
    const exporter = new MarkdownExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.Markdown,
      media: { strategy: 'reference' },
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_IMAGE]; }());
    expect(out).toMatch(/!\[.*\]\(.*cdn\.discordapp/);
  });

  it('renders file as markdown link', async () => {
    const exporter = new MarkdownExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.Markdown,
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_FILE]; }());
    expect(out).toContain('[report.pdf]');
  });

  it('renders reactions as blockquote line', async () => {
    const exporter = new MarkdownExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.Markdown,
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_REACTIONS]; }());
    expect(out).toContain('👍');
    expect(out).toContain('> ');
  });

  it('renders embed with title and description', async () => {
    const exporter = new MarkdownExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.Markdown,
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_EMBED]; }());
    expect(out).toContain('Example Embed');
    expect(out).toContain('embed description');
  });

  it('groups consecutive messages from the same author', async () => {
    const exporter = new MarkdownExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.Markdown,
    });
    // MSG_PLAIN and MSG_CONTINUATION are from Alice within 5 min
    const out = await exporter.toString(
      async function* () { yield [MSG_PLAIN, MSG_CONTINUATION]; }(),
    );
    // Author header should appear once, not twice
    const matches = [...out.matchAll(/\*\*Alice\*\*/g)];
    expect(matches.length).toBe(1);
  });

  it('includes day separator between different days', async () => {
    const out = await exportAll(MarkdownExporter, { ...BASE_OPTS, format: ExportFormat.Markdown });
    expect(out).toContain('### June 15');
    expect(out).toContain('### June 16');
  });
});

// ─── HTML exporter ────────────────────────────────────────────────────────────

describe('HtmlExporter', () => {
  it('produces valid HTML structure', async () => {
    const out = await exportAll(HtmlExporter, { ...BASE_OPTS, format: ExportFormat.HTML });
    expect(out).toContain('<!DOCTYPE html>');
    expect(out).toContain('<html');
    expect(out).toContain('</html>');
  });

  it('includes channel name in page title and header', async () => {
    const out = await exportAll(HtmlExporter, { ...BASE_OPTS, format: ExportFormat.HTML });
    expect(out).toContain('general');
    expect(out).toContain('Test Server');
  });

  it('renders message content', async () => {
    const exporter = new HtmlExporter(TEST_CHANNEL, { ...BASE_OPTS, format: ExportFormat.HTML });
    const out = await exporter.toString(async function* () { yield [MSG_PLAIN]; }());
    expect(out).toContain('Hello, world!');
    expect(out).toContain('Alice');
  });

  it('renders images with lazy loading', async () => {
    const exporter = new HtmlExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.HTML,
      media: { strategy: 'reference' },
    });
    const out = await exporter.toString(async function* () { yield [MSG_WITH_IMAGE]; }());
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('attachment-image');
  });

  it('wraps spoiler images with spoiler class', async () => {
    const exporter = new HtmlExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.HTML,
    });
    const out = await exporter.toString(
      async function* () { yield [MSG_WITH_SPOILER_IMAGE]; }(),
    );
    expect(out).toContain('class="attachment-image-wrap spoiler"');
  });

  it('renders reactions', async () => {
    const exporter = new HtmlExporter(TEST_CHANNEL, { ...BASE_OPTS, format: ExportFormat.HTML });
    const out = await exporter.toString(
      async function* () { yield [MSG_WITH_REACTIONS]; }(),
    );
    expect(out).toContain('class="reactions"');
    expect(out).toContain('👍');
  });

  it('omits reactions when include.reactions is false', async () => {
    const exporter = new HtmlExporter(TEST_CHANNEL, {
      ...BASE_OPTS,
      format: ExportFormat.HTML,
      include: { reactions: false },
    });
    const out = await exporter.toString(
      async function* () { yield [MSG_WITH_REACTIONS]; }(),
    );
    expect(out).not.toContain('class="reactions"');
  });

  it('renders system message with system-message class', async () => {
    const exporter = new HtmlExporter(TEST_CHANNEL, { ...BASE_OPTS, format: ExportFormat.HTML });
    const out = await exporter.toString(
      async function* () { yield [MSG_SYSTEM_JOIN]; }(),
    );
    expect(out).toContain('system-message');
    expect(out).toContain('joined the server');
  });

  it('does not contain XSS from user content', async () => {
    const xssMsg = {
      ...MSG_PLAIN,
      content: '<script>alert("xss")</script>',
      author: { ...MSG_PLAIN.author, displayName: '<img src=x onerror=alert(1)>' },
    };
    const exporter = new HtmlExporter(TEST_CHANNEL, { ...BASE_OPTS, format: ExportFormat.HTML });
    const out = await exporter.toString(async function* () { yield [xssMsg]; }());
    // Raw unescaped script tag must not appear
    expect(out).not.toContain('<script>alert');
    // The displayName is in the output but must be HTML-escaped, not raw
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
    // No raw unescaped <img with event handler should exist
    expect(out).not.toContain('<img src=x onerror=');
  });

  it('includes inline CSS', async () => {
    const out = await exportAll(HtmlExporter, { ...BASE_OPTS, format: ExportFormat.HTML });
    expect(out).toContain('<style>');
    expect(out).toContain('--bg-primary');
  });

  it('includes client script', async () => {
    const out = await exportAll(HtmlExporter, { ...BASE_OPTS, format: ExportFormat.HTML });
    expect(out).toContain('<script>');
    expect(out).toContain('spoiler');
  });

  it('patches message count after streaming', async () => {
    const out = await exportAll(HtmlExporter, { ...BASE_OPTS, format: ExportFormat.HTML });
    // The patch script updates the count badge
    expect(out).toContain('message-count');
    expect(out).toMatch(/\d+ messages/);
  });
});
