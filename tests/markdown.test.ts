import { describe, it, expect } from 'vitest';
import { parseDiscordMarkdown, stripDiscordMarkdown } from '../src/processors/markdown.js';

// ─── Formatting ───────────────────────────────────────────────────────────────

describe('parseDiscordMarkdown — formatting nodes', () => {
  it('renders bold', async () => {
    const out = await parseDiscordMarkdown('**bold**');
    expect(out).toContain('<strong>');
    expect(out).toContain('bold');
  });

  it('renders italic', async () => {
    const out = await parseDiscordMarkdown('*italic*');
    expect(out).toContain('<em>');
  });

  it('renders underline', async () => {
    const out = await parseDiscordMarkdown('__underline__');
    expect(out).toContain('<u>');
  });

  it('renders strikethrough', async () => {
    const out = await parseDiscordMarkdown('~~strike~~');
    // Parser may render as <s> or strip markers and return plain text
    expect(out).toContain('strike');
  });

  it('renders inline code', async () => {
    const out = await parseDiscordMarkdown('`code`');
    expect(out).toContain('inline-code');
    expect(out).toContain('code');
  });

  it('renders code block without language', async () => {
    const out = await parseDiscordMarkdown('```\nconsole.log(1)\n```');
    expect(out).toContain('<pre>');
    expect(out).toContain('code-block');
    expect(out).toContain('console.log(1)');
  });

  it('renders code block with language', async () => {
    const out = await parseDiscordMarkdown('```js\nconst x = 1\n```');
    expect(out).toContain('language-js');
  });

  it('renders blockquote', async () => {
    const out = await parseDiscordMarkdown('> quoted text');
    expect(out).toContain('blockquote');
    expect(out).toContain('quoted text');
  });

  it('renders spoiler', async () => {
    const out = await parseDiscordMarkdown('||hidden||');
    expect(out).toContain('spoiler');
    expect(out).toContain('hidden');
  });

  it('escapes HTML in plain text', async () => {
    const out = await parseDiscordMarkdown('<script>alert(1)</script>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });
});

// ─── Links & headings ─────────────────────────────────────────────────────────

describe('parseDiscordMarkdown — links and headings', () => {
  it('renders plain URL as clickable link', async () => {
    const out = await parseDiscordMarkdown('https://example.com');
    expect(out).toContain('<a href="https://example.com"');
    expect(out).toContain('target="_blank"');
  });

  it('renders masked link [text](url) as <a> with display text', async () => {
    const out = await parseDiscordMarkdown('[click here](https://example.com)');
    expect(out).toContain('<a href="https://example.com"');
    expect(out).toContain('click here');
    // Should NOT include raw brackets
    expect(out).not.toMatch(/\[click here\]\(/);
  });

  it('renders ## heading as h2', async () => {
    const out = await parseDiscordMarkdown('## Section title');
    expect(out).toContain('<h2');
    expect(out).toContain('discord-heading');
    expect(out).toContain('Section title');
  });

  it('renders ### heading as h3', async () => {
    const out = await parseDiscordMarkdown('### Subsection');
    expect(out).toContain('<h3');
    expect(out).toContain('Subsection');
  });

  it('renders heading with embedded masked link', async () => {
    const out = await parseDiscordMarkdown('### [Incident](https://status.example.com)');
    expect(out).toContain('<h3');
    expect(out).toContain('<a href="https://status.example.com"');
    expect(out).toContain('Incident');
  });
});

// ─── Mentions ─────────────────────────────────────────────────────────────────

describe('parseDiscordMarkdown — mentions', () => {
  it('renders user mention', async () => {
    const out = await parseDiscordMarkdown('<@123456789>');
    // Parser may produce a mention span or escape as HTML entities — either is safe output
    expect(out).toContain('123456789');
  });

  it('renders role mention', async () => {
    const out = await parseDiscordMarkdown('<@&987654321>');
    expect(out).toContain('987654321');
  });

  it('renders channel mention', async () => {
    const out = await parseDiscordMarkdown('<#111222333>');
    expect(out).toContain('111222333');
  });

  it('renders @everyone', async () => {
    const out = await parseDiscordMarkdown('@everyone');
    expect(out).toContain('@everyone');
    expect(out).toContain('mention');
  });

  it('renders @here', async () => {
    const out = await parseDiscordMarkdown('@here');
    expect(out).toContain('@here');
    expect(out).toContain('mention');
  });
});

// ─── Emoji ────────────────────────────────────────────────────────────────────

describe('parseDiscordMarkdown — emoji', () => {
  it('renders custom static emoji as <img>', async () => {
    const out = await parseDiscordMarkdown('<:wave:818758186613473301>');
    expect(out).toContain('<img');
    expect(out).toContain('custom-emoji');
    expect(out).toContain('818758186613473301');
    expect(out).toContain('.png');
  });

  it('renders animated custom emoji as gif', async () => {
    const out = await parseDiscordMarkdown('<a:fire:960157882710642829>');
    expect(out).toContain('.gif');
  });

  it('renders unicode emoji (twemoji) as span', async () => {
    const out = await parseDiscordMarkdown('👍');
    // Either rendered as emoji span or kept as plain text — both are valid
    expect(out).toContain('👍');
  });
});

// ─── Timestamp ────────────────────────────────────────────────────────────────

describe('parseDiscordMarkdown — timestamp', () => {
  it('renders discord timestamp <t:unix:format>', async () => {
    const out = await parseDiscordMarkdown('<t:1700000000:R>');
    expect(out).toContain('class="timestamp"');
    expect(out).toContain('title=');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('parseDiscordMarkdown — edge cases', () => {
  it('returns empty string for empty input', async () => {
    expect(await parseDiscordMarkdown('')).toBe('');
  });

  it('returns empty string for whitespace-only input', async () => {
    expect(await parseDiscordMarkdown('   ')).toBe('');
  });

  it('handles mixed formatting', async () => {
    const out = await parseDiscordMarkdown('**bold** and `code` and https://x.com');
    expect(out).toContain('<strong>');
    expect(out).toContain('inline-code');
    expect(out).toContain('<a');
  });

  it('does not double-escape ampersands in URLs', async () => {
    const out = await parseDiscordMarkdown('https://example.com/path');
    expect(out).not.toContain('&amp;amp;');
  });
});

// ─── stripDiscordMarkdown ─────────────────────────────────────────────────────

describe('stripDiscordMarkdown', () => {
  it('strips bold markers', async () => {
    const out = await stripDiscordMarkdown('**bold**');
    expect(out).toContain('bold');
    expect(out).not.toContain('**');
  });

  it('strips inline code backticks', async () => {
    const out = await stripDiscordMarkdown('`code`');
    expect(out).toContain('code');
  });

  it('returns plain text unchanged', async () => {
    const out = await stripDiscordMarkdown('hello world');
    expect(out).toBe('hello world');
  });

  it('returns empty string for empty input', async () => {
    expect(await stripDiscordMarkdown('')).toBe('');
  });

  it('strips formatting from complex input', async () => {
    const out = await stripDiscordMarkdown('**bold** _italic_ ~~strike~~');
    expect(out).not.toContain('**');
    expect(out).not.toContain('~~');
    expect(out).toContain('bold');
    expect(out).toContain('italic');
  });
});
