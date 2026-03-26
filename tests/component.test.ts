import { describe, it, expect } from 'vitest';
import { renderComponentHtml, renderComponentText } from '../src/processors/component.js';

// ─── renderComponentHtml ──────────────────────────────────────────────────────

describe('renderComponentHtml — type 10 (TextDisplay)', () => {
  it('renders plain text content', async () => {
    const out = await renderComponentHtml({ type: 10, content: 'Hello world' });
    expect(out).toContain('comp-text');
    expect(out).toContain('Hello world');
  });

  it('renders markdown inside TextDisplay', async () => {
    const out = await renderComponentHtml({ type: 10, content: '**bold**' });
    expect(out).toContain('<strong>');
  });

  it('handles empty content', async () => {
    const out = await renderComponentHtml({ type: 10, content: '' });
    expect(out).toContain('comp-text');
  });
});

describe('renderComponentHtml — type 14 (Separator)', () => {
  it('renders <hr> when divider is true', async () => {
    const out = await renderComponentHtml({ type: 14, divider: true });
    expect(out).toContain('<hr');
    expect(out).toContain('comp-separator');
  });

  it('renders <hr> when divider is not set (default)', async () => {
    const out = await renderComponentHtml({ type: 14 });
    expect(out).toContain('<hr');
  });

  it('renders spacer div when divider is false', async () => {
    const out = await renderComponentHtml({ type: 14, divider: false });
    expect(out).toContain('comp-spacer');
    expect(out).not.toContain('<hr');
  });

  it('uses large spacing class when spacing=2', async () => {
    const out = await renderComponentHtml({ type: 14, divider: true, spacing: 2 });
    expect(out).toContain('comp-separator--large');
  });

  it('uses small spacing class by default', async () => {
    const out = await renderComponentHtml({ type: 14, divider: true });
    expect(out).toContain('comp-separator--small');
  });
});

describe('renderComponentHtml — type 11 (Thumbnail)', () => {
  it('renders img with url from media.url', async () => {
    const out = await renderComponentHtml({
      type: 11,
      media: { url: 'https://example.com/thumb.png' },
    });
    expect(out).toContain('comp-thumbnail');
    expect(out).toContain('<img');
    expect(out).toContain('https://example.com/thumb.png');
  });

  it('renders nothing for missing url', async () => {
    const out = await renderComponentHtml({ type: 11 });
    expect(out).toBe('');
  });

  it('escapes HTML in URL', async () => {
    const out = await renderComponentHtml({
      type: 11,
      media: { url: 'https://example.com/img?a=1&b=2' },
    });
    expect(out).toContain('&amp;');
    expect(out).not.toContain('&b=2');
  });
});

describe('renderComponentHtml — type 12 (MediaGallery)', () => {
  it('renders image items', async () => {
    const out = await renderComponentHtml({
      type: 12,
      items: [{ media: { url: 'https://example.com/a.png' } }],
    });
    expect(out).toContain('comp-media-gallery');
    expect(out).toContain('comp-media-gallery--1');
    expect(out).toContain('<img');
    expect(out).toContain('https://example.com/a.png');
  });

  it('renders video items', async () => {
    const out = await renderComponentHtml({
      type: 12,
      items: [{ media: { url: 'https://example.com/clip.mp4' } }],
    });
    expect(out).toContain('<video');
  });

  it('caps gallery at 4 columns even with 5 items', async () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      media: { url: `https://example.com/${i}.png` },
    }));
    const out = await renderComponentHtml({ type: 12, items });
    expect(out).toContain('comp-media-gallery--4');
    expect(out).not.toContain('comp-media-gallery--5');
  });

  it('renders nothing when items is empty', async () => {
    const out = await renderComponentHtml({ type: 12, items: [] });
    expect(out).toBe('');
  });
});

describe('renderComponentHtml — type 13 (File)', () => {
  it('renders a link with filename', async () => {
    const out = await renderComponentHtml({
      type: 13,
      file: { url: 'https://cdn.discord.com/file.pdf', filename: 'report.pdf' },
    });
    expect(out).toContain('comp-file');
    expect(out).toContain('report.pdf');
    expect(out).toContain('href="https://cdn.discord.com/file.pdf"');
  });

  it('falls back to url basename when filename missing', async () => {
    const out = await renderComponentHtml({
      type: 13,
      file: { url: 'https://cdn.discord.com/data.csv' },
    });
    expect(out).toContain('data.csv');
  });

  it('renders nothing when url is empty', async () => {
    const out = await renderComponentHtml({ type: 13 });
    expect(out).toBe('');
  });
});

describe('renderComponentHtml — type 2 (Button)', () => {
  it('renders a link button with url', async () => {
    const out = await renderComponentHtml({
      type: 2,
      label: 'Click me',
      url: 'https://example.com',
    });
    expect(out).toContain('comp-button--link');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('Click me');
  });

  it('renders a non-link button as span', async () => {
    const out = await renderComponentHtml({ type: 2, label: 'Submit' });
    expect(out).toContain('comp-button');
    expect(out).toContain('Submit');
    expect(out).not.toContain('<a ');
  });

  it('renders emoji with custom id as img', async () => {
    const out = await renderComponentHtml({
      type: 2,
      label: 'Go',
      emoji: { id: '12345', name: 'wave' },
    });
    expect(out).toContain('comp-btn-emoji');
    expect(out).toContain('12345');
  });

  it('renders unicode emoji as span', async () => {
    const out = await renderComponentHtml({
      type: 2,
      label: 'Go',
      emoji: { name: '👋' },
    });
    expect(out).toContain('👋');
  });
});

describe('renderComponentHtml — type 1 (ActionRow)', () => {
  it('renders action row with buttons', async () => {
    const out = await renderComponentHtml({
      type: 1,
      components: [
        { type: 2, label: 'Approve', url: null },
        { type: 2, label: 'Reject', url: null },
      ],
    });
    expect(out).toContain('comp-action-row');
    expect(out).toContain('Approve');
    expect(out).toContain('Reject');
  });

  it('renders empty action row for no components', async () => {
    const out = await renderComponentHtml({ type: 1, components: [] });
    expect(out).toContain('comp-action-row');
  });
});

describe('renderComponentHtml — type 9 (Section)', () => {
  it('renders section with text children', async () => {
    const out = await renderComponentHtml({
      type: 9,
      components: [{ type: 10, content: 'Section text' }],
    });
    expect(out).toContain('comp-section');
    expect(out).toContain('comp-section-body');
    expect(out).toContain('Section text');
  });

  it('renders section with accessory thumbnail', async () => {
    const out = await renderComponentHtml({
      type: 9,
      components: [{ type: 10, content: 'Text' }],
      accessory: { type: 11, media: { url: 'https://example.com/img.png' } },
    });
    expect(out).toContain('comp-section-accessory');
    expect(out).toContain('comp-thumbnail');
  });

  it('omits accessory div when no accessory', async () => {
    const out = await renderComponentHtml({
      type: 9,
      components: [{ type: 10, content: 'Text' }],
    });
    expect(out).not.toContain('comp-section-accessory');
  });
});

describe('renderComponentHtml — type 17 (Container)', () => {
  it('renders container with child components', async () => {
    const out = await renderComponentHtml({
      type: 17,
      components: [{ type: 10, content: 'Container content' }],
    });
    expect(out).toContain('comp-container');
    expect(out).toContain('Container content');
  });

  it('applies accent color as border-left-color style', async () => {
    const out = await renderComponentHtml({
      type: 17,
      accent_color: 0x5865f2,
      components: [],
    });
    expect(out).toContain('border-left-color:#5865f2');
  });

  it('omits style when accent_color is null', async () => {
    const out = await renderComponentHtml({
      type: 17,
      accent_color: null,
      components: [],
    });
    expect(out).not.toContain('border-left-color');
  });

  it('pads accent color with leading zeros', async () => {
    const out = await renderComponentHtml({
      type: 17,
      accent_color: 0x001122,
      components: [],
    });
    expect(out).toContain('border-left-color:#001122');
  });
});

describe('renderComponentHtml — unknown type', () => {
  it('renders children for unknown type', async () => {
    const out = await renderComponentHtml({
      type: 99,
      components: [{ type: 10, content: 'Nested' }],
    });
    expect(out).toContain('Nested');
  });

  it('returns empty string for unknown type with no children', async () => {
    const out = await renderComponentHtml({ type: 99 });
    expect(out).toBe('');
  });
});

// ─── renderComponentText ──────────────────────────────────────────────────────

describe('renderComponentText — type 10 (TextDisplay)', () => {
  it('returns plain text stripped of markdown', async () => {
    const out = await renderComponentText({ type: 10, content: '**bold** text' });
    expect(out).toContain('bold');
    expect(out).not.toContain('**');
  });

  it('handles empty content', async () => {
    const out = await renderComponentText({ type: 10, content: '' });
    expect(out).toBe('');
  });
});

describe('renderComponentText — type 14 (Separator)', () => {
  it('returns --- when divider is true', async () => {
    const out = await renderComponentText({ type: 14, divider: true });
    expect(out).toBe('---');
  });

  it('returns empty string when divider is false', async () => {
    const out = await renderComponentText({ type: 14, divider: false });
    expect(out).toBe('');
  });

  it('returns --- by default (no divider prop)', async () => {
    const out = await renderComponentText({ type: 14 });
    expect(out).toBe('---');
  });
});

describe('renderComponentText — type 11 (Thumbnail)', () => {
  it('returns image label with url', async () => {
    const out = await renderComponentText({
      type: 11,
      media: { url: 'https://example.com/img.png' },
    });
    expect(out).toContain('[image:');
    expect(out).toContain('https://example.com/img.png');
  });
});

describe('renderComponentText — type 12 (MediaGallery)', () => {
  it('returns one label per media item', async () => {
    const out = await renderComponentText({
      type: 12,
      items: [
        { media: { url: 'https://example.com/a.png' } },
        { media: { url: 'https://example.com/b.png' } },
      ],
    });
    expect(out).toContain('[media:');
    expect(out).toContain('a.png');
    expect(out).toContain('b.png');
  });
});

describe('renderComponentText — type 13 (File)', () => {
  it('returns file label with filename', async () => {
    const out = await renderComponentText({
      type: 13,
      file: { filename: 'report.pdf' },
    });
    expect(out).toBe('[file: report.pdf]');
  });

  it('falls back to url when filename missing', async () => {
    const out = await renderComponentText({
      type: 13,
      url: 'https://cdn.discord.com/f.zip',
    });
    expect(out).toContain('https://cdn.discord.com/f.zip');
  });
});

describe('renderComponentText — type 1 (ActionRow)', () => {
  it('formats buttons as [label] tokens joined by space', async () => {
    const out = await renderComponentText({
      type: 1,
      components: [
        { type: 2, label: 'Yes' },
        { type: 2, label: 'No' },
      ],
    });
    expect(out).toBe('[Yes] [No]');
  });

  it('uses "button" label when button has no label', async () => {
    const out = await renderComponentText({ type: 1, components: [{ type: 2 }] });
    expect(out).toBe('[button]');
  });
});

describe('renderComponentText — type 9 (Section)', () => {
  it('concatenates child text with newlines', async () => {
    const out = await renderComponentText({
      type: 9,
      components: [
        { type: 10, content: 'Line one' },
        { type: 10, content: 'Line two' },
      ],
    });
    expect(out).toContain('Line one');
    expect(out).toContain('Line two');
  });
});

describe('renderComponentText — type 17 (Container)', () => {
  it('concatenates child text', async () => {
    const out = await renderComponentText({
      type: 17,
      components: [{ type: 10, content: 'Container text' }],
    });
    expect(out).toContain('Container text');
  });
});
