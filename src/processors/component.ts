/**
 * Discord Components v2 renderer.
 *
 * Component types (from Discord API docs):
 *   1  = ActionRow         — container for interactive components (buttons, selects)
 *   2  = Button
 *   9  = Section           — text blocks + optional thumbnail accessory
 *   10 = TextDisplay       — markdown text block
 *   11 = Thumbnail         — image accessory (inside Section)
 *   12 = MediaGallery      — grid of images/videos
 *   13 = File              — file attachment display
 *   14 = Separator         — visual divider
 *   17 = Container         — colored wrapper grouping other components
 *
 * Reference: https://docs.discord.com/developers/components/reference
 */

import { parseDiscordMarkdown, stripDiscordMarkdown } from './markdown.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawComponent = any;

function escHtmlComp(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Individual type renderers ────────────────────────────────────────────────

async function renderTextDisplay(c: RawComponent): Promise<string> {
  const html = await parseDiscordMarkdown(String(c.content ?? ''));
  return `<div class="comp-text">${html}</div>`;
}

function renderMediaItem(item: RawComponent): string {
  const url = escHtmlComp(String(item.media?.url ?? item.url ?? ''));
  const alt = escHtmlComp(String(item.description ?? item.media?.description ?? ''));
  const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
  if (!url) return '';
  if (isVideo) {
    return `<div class="comp-media-item">
      <video src="${url}" controls preload="metadata"></video>
      ${alt ? `<div class="comp-media-caption">${alt}</div>` : ''}
    </div>`;
  }
  return `<div class="comp-media-item">
    <img src="${url}" alt="${alt}" loading="lazy">
    ${alt ? `<div class="comp-media-caption">${alt}</div>` : ''}
  </div>`;
}

function renderMediaGallery(c: RawComponent): string {
  const items: RawComponent[] = Array.isArray(c.items) ? c.items : [];
  if (items.length === 0) return '';
  const count = Math.min(items.length, 4);
  return `<div class="comp-media-gallery comp-media-gallery--${count}">${items.map(renderMediaItem).join('')}</div>`;
}

function renderThumbnail(c: RawComponent): string {
  const url = escHtmlComp(String(c.media?.url ?? c.url ?? ''));
  const alt = escHtmlComp(String(c.description ?? ''));
  if (!url) return '';
  return `<div class="comp-thumbnail"><img src="${url}" alt="${alt}" loading="lazy"></div>`;
}

function renderFile(c: RawComponent): string {
  const url = escHtmlComp(String(c.file?.url ?? c.url ?? ''));
  const name = escHtmlComp(String(c.file?.filename ?? c.filename ?? url.split('/').pop() ?? 'file'));
  if (!url) return '';
  return `<a class="comp-file" href="${url}" target="_blank" rel="noopener noreferrer">
    <span class="comp-file-icon">📎</span>
    <span class="comp-file-name">${name}</span>
  </a>`;
}

function renderSeparator(c: RawComponent): string {
  const spacing = c.spacing === 2 ? 'large' : 'small';
  return c.divider !== false
    ? `<hr class="comp-separator comp-separator--${spacing}">`
    : `<div class="comp-spacer comp-spacer--${spacing}"></div>`;
}

function renderButton(c: RawComponent): string {
  const label = escHtmlComp(String(c.label ?? ''));
  const url = c.url ? escHtmlComp(c.url) : null;
  const emoji = c.emoji
    ? c.emoji.id
      ? `<img class="comp-btn-emoji" src="https://cdn.discordapp.com/emojis/${c.emoji.id}.png?size=16" alt=":${escHtmlComp(c.emoji.name ?? '')}:">`
      : `<span>${escHtmlComp(c.emoji.name ?? '')}</span>`
    : '';

  if (url) {
    return `<a class="comp-button comp-button--link" href="${url}" target="_blank" rel="noopener noreferrer">${emoji}${label}</a>`;
  }
  return `<span class="comp-button">${emoji}${label}</span>`;
}

async function renderActionRow(c: RawComponent): Promise<string> {
  const inner: RawComponent[] = Array.isArray(c.components) ? c.components : [];
  const buttons = inner.map(renderButton).join('');
  return `<div class="comp-action-row">${buttons}</div>`;
}

// ─── Recursive async renderer ─────────────────────────────────────────────────

export async function renderComponentHtml(c: RawComponent): Promise<string> {
  const type = Number(c.type ?? 0);

  switch (type) {
    case 1:  return renderActionRow(c);
    case 2:  return renderButton(c);
    case 9: {
      const children: RawComponent[] = Array.isArray(c.components) ? c.components : [];
      const childHtml = (await Promise.all(children.map(renderComponentHtml))).join('');
      const accessoryHtml = c.accessory ? await renderComponentHtml(c.accessory) : '';
      return `<div class="comp-section">
        <div class="comp-section-body">${childHtml}</div>
        ${accessoryHtml ? `<div class="comp-section-accessory">${accessoryHtml}</div>` : ''}
      </div>`;
    }
    case 10: return renderTextDisplay(c);
    case 11: return renderThumbnail(c);
    case 12: return renderMediaGallery(c);
    case 13: return renderFile(c);
    case 14: return renderSeparator(c);
    case 17: {
      const accent = c.accent_color != null
        ? ` style="border-left-color:#${Number(c.accent_color).toString(16).padStart(6, '0')}"`
        : '';
      const children: RawComponent[] = Array.isArray(c.components) ? c.components : [];
      const childHtml = (await Promise.all(children.map(renderComponentHtml))).join('');
      return `<div class="comp-container"${accent}>${childHtml}</div>`;
    }
    default: {
      const children: RawComponent[] = Array.isArray(c.components) ? c.components : [];
      return (await Promise.all(children.map(renderComponentHtml))).join('');
    }
  }
}

// ─── Plain-text renderer (for Markdown / TXT exporters) ──────────────────────

export async function renderComponentText(c: RawComponent): Promise<string> {
  const type = Number(c.type ?? 0);

  switch (type) {
    case 1: {
      const children: RawComponent[] = Array.isArray(c.components) ? c.components : [];
      return children.map((b: RawComponent) => `[${b.label ?? 'button'}]`).join(' ');
    }
    case 9: {
      const children: RawComponent[] = Array.isArray(c.components) ? c.components : [];
      return (await Promise.all(children.map(renderComponentText))).join('\n');
    }
    case 10: return stripDiscordMarkdown(String(c.content ?? ''));
    case 11: return `[image: ${c.media?.url ?? ''}]`;
    case 12: {
      const items: RawComponent[] = Array.isArray(c.items) ? c.items : [];
      return items.map((i: RawComponent) => `[media: ${i.media?.url ?? i.url ?? ''}]`).join('\n');
    }
    case 13: return `[file: ${c.file?.filename ?? c.url ?? 'attachment'}]`;
    case 14: return c.divider !== false ? '---' : '';
    case 17: {
      const children: RawComponent[] = Array.isArray(c.components) ? c.components : [];
      return (await Promise.all(children.map(renderComponentText))).join('\n');
    }
    default: {
      const children: RawComponent[] = Array.isArray(c.components) ? c.components : [];
      return (await Promise.all(children.map(renderComponentText))).join('\n');
    }
  }
}
