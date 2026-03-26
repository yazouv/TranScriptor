import { escHtml } from './template.js';
import { formatBytes, formatDate, formatDateShort } from '../base.js';
import { parseDiscordMarkdown } from '../../processors/markdown.js';
import { AttachmentType, MessageType } from '../../types.js';
import type {
  NormalizedAttachment,
  NormalizedEmbed,
  NormalizedMessage,
  NormalizedReaction,
  NormalizedSticker,
  TranscriptOptions,
} from '../../types.js';

// ─── Attachment renderers ─────────────────────────────────────────────────────

function renderImage(att: NormalizedAttachment): string {
  const spoilerClass = att.spoiler ? ' spoiler' : '';
  const dims = att.width && att.height
    ? ` width="${Math.min(att.width, 520)}" height="${Math.min(att.height, 350)}"`
    : '';
  return `<div class="attachment-image-wrap${spoilerClass}">
    <img class="attachment-image" src="${escHtml(att.resolvedUrl)}" alt="${escHtml(att.filename)}"${dims} loading="lazy">
  </div>`;
}

function renderVideo(att: NormalizedAttachment): string {
  return `<video class="attachment-video" controls preload="metadata">
    <source src="${escHtml(att.resolvedUrl)}" type="${escHtml(att.contentType ?? 'video/mp4')}">
    <a href="${escHtml(att.resolvedUrl)}">${escHtml(att.filename)}</a>
  </video>`;
}

function renderAudio(att: NormalizedAttachment): string {
  return `<audio class="attachment-audio" controls preload="metadata">
    <source src="${escHtml(att.resolvedUrl)}" type="${escHtml(att.contentType ?? 'audio/mpeg')}">
    <a href="${escHtml(att.resolvedUrl)}">${escHtml(att.filename)}</a>
  </audio>`;
}

function renderFile(att: NormalizedAttachment): string {
  const icons: Record<string, string> = {
    pdf: '📄', zip: '🗜️', rar: '🗜️', gz: '🗜️', tar: '🗜️',
    doc: '📝', docx: '📝', txt: '📝', md: '📝',
    xls: '📊', xlsx: '📊', csv: '📊',
    mp3: '🎵', wav: '🎵', ogg: '🎵',
    mp4: '🎬', mov: '🎬', avi: '🎬',
  };
  const ext = att.filename.split('.').pop()?.toLowerCase() ?? '';
  const icon = icons[ext] ?? '📎';

  return `<a class="attachment-file" href="${escHtml(att.resolvedUrl)}" target="_blank" rel="noopener noreferrer">
    <span class="attachment-file-icon">${icon}</span>
    <div class="attachment-file-info">
      <span class="attachment-file-name">${escHtml(att.filename)}</span>
      <span class="attachment-file-size">${formatBytes(att.size)}</span>
    </div>
  </a>`;
}

function renderAttachment(att: NormalizedAttachment, strategy: string | undefined): string {
  if (strategy === 'none') {
    return `<span class="attachment-placeholder">[${att.type.toUpperCase()}: ${escHtml(att.filename)} (${formatBytes(att.size)})]</span>`;
  }
  switch (att.type) {
    case AttachmentType.Image: return renderImage(att);
    case AttachmentType.Video: return renderVideo(att);
    case AttachmentType.Audio: return renderAudio(att);
    default:                   return renderFile(att);
  }
}

// ─── Embed renderer ───────────────────────────────────────────────────────────

function renderEmbed(embed: NormalizedEmbed): string {
  const colorStyle = embed.color
    ? ` style="border-left-color:#${embed.color.toString(16).padStart(6, '0')}"`
    : '';

  const author = embed.author
    ? `<div class="embed-author">
        ${embed.author.iconURL ? `<img src="${escHtml(embed.author.iconURL)}" alt="" loading="lazy">` : ''}
        ${embed.author.url
          ? `<a href="${escHtml(embed.author.url)}" target="_blank" rel="noopener noreferrer">${escHtml(embed.author.name)}</a>`
          : escHtml(embed.author.name)}
      </div>`
    : '';

  const title = embed.title
    ? `<div class="embed-title">${
        embed.url
          ? `<a href="${escHtml(embed.url)}" target="_blank" rel="noopener noreferrer">${escHtml(embed.title)}</a>`
          : escHtml(embed.title)
      }</div>`
    : '';

  const description = embed.description
    ? `<div class="embed-description">${escHtml(embed.description)}</div>`
    : '';

  const fields = embed.fields.length > 0
    ? `<div class="embed-fields">${embed.fields.map((f) =>
        `<div class="embed-field${f.inline ? ' inline' : ''}">
          <div class="embed-field-name">${escHtml(f.name)}</div>
          <div class="embed-field-value">${escHtml(f.value)}</div>
        </div>`
      ).join('')}</div>`
    : '';

  const image = embed.image
    ? `<div class="embed-image"><img src="${escHtml(embed.image.resolvedUrl)}" alt="embed image" loading="lazy"></div>`
    : '';

  const thumbnail = embed.thumbnail
    ? `<div class="embed-thumbnail"><img src="${escHtml(embed.thumbnail.resolvedUrl)}" alt="thumbnail" loading="lazy"></div>`
    : '';

  const footer = embed.footer
    ? `<div class="embed-footer">
        ${embed.footer.iconURL ? `<img src="${escHtml(embed.footer.iconURL)}" alt="" loading="lazy">` : ''}
        <span>${escHtml(embed.footer.text)}</span>
        ${embed.timestamp ? `<span>·</span><span>${formatDate(embed.timestamp)}</span>` : ''}
      </div>`
    : '';

  return `<div class="embed"${colorStyle}>
    <div class="embed-body">
      ${author}${title}${description}${fields}${image}${footer}
    </div>
    ${thumbnail}
  </div>`;
}

// ─── Reaction renderer ────────────────────────────────────────────────────────

function renderReactions(reactions: NormalizedReaction[]): string {
  if (reactions.length === 0) return '';
  const items = reactions.map((r) => {
    const emojiHtml = r.emojiURL
      ? `<img src="${escHtml(r.emojiURL)}" alt="${escHtml(r.emoji)}" loading="lazy">`
      : `<span>${r.emoji}</span>`;
    return `<div class="reaction" title="${escHtml(r.emoji)}">${emojiHtml}<span class="reaction-count">${r.count}</span></div>`;
  });
  return `<div class="reactions">${items.join('')}</div>`;
}

// ─── Sticker renderer ─────────────────────────────────────────────────────────

function renderSticker(sticker: NormalizedSticker, strategy: string | undefined): string {
  if (strategy === 'none') {
    return `<div class="sticker">[Sticker: ${escHtml(sticker.name)}]</div>`;
  }
  return `<div class="sticker">
    <img src="${escHtml(sticker.resolvedUrl)}" alt="${escHtml(sticker.name)}" title="${escHtml(sticker.name)}" loading="lazy">
  </div>`;
}

// ─── Reply bar renderer ───────────────────────────────────────────────────────

function renderReplyBar(reply: NormalizedMessage): string {
  const avatarSrc = reply.author.avatarURL
    ? `<img class="reply-avatar" src="${escHtml(reply.author.avatarURL)}" alt="" loading="lazy">`
    : '';
  const preview = escHtml(reply.content.slice(0, 100)) + (reply.content.length > 100 ? '…' : '');

  return `<div class="reply-bar">
    ${avatarSrc}
    <span class="reply-author" style="${reply.author.roleColor ? `color:${reply.author.roleColor}` : ''}">${escHtml(reply.author.displayName)}</span>
    <span class="reply-content" data-goto="${escHtml(reply.id)}">${preview || '<em>Click to see attachment</em>'}</span>
  </div>`;
}

// ─── Public message renderer ──────────────────────────────────────────────────

/**
 * Determines whether two consecutive messages should be grouped
 * (same author, same day, within 5 minutes).
 */
export function isContinuation(msg: NormalizedMessage, prev: NormalizedMessage | null): boolean {
  if (!prev) return false;
  if (prev.author.id !== msg.author.id) return false;
  if (msg.type !== MessageType.Default && msg.type !== MessageType.ApplicationCommand) return false;
  if (prev.type !== MessageType.Default && prev.type !== MessageType.ApplicationCommand) return false;
  if (msg.replyTo) return false;

  const gap = msg.timestamp.getTime() - prev.timestamp.getTime();
  if (gap > 5 * 60 * 1000) return false; // 5 minutes

  // Different calendar day
  if (
    prev.timestamp.getFullYear() !== msg.timestamp.getFullYear() ||
    prev.timestamp.getMonth() !== msg.timestamp.getMonth() ||
    prev.timestamp.getDate() !== msg.timestamp.getDate()
  ) return false;

  return true;
}

/**
 * Detects whether a message content contains only emoji (up to 3).
 * Used to render large emoji.
 */
function isEmojiOnly(content: string): boolean {
  const stripped = content.trim();
  if (!stripped) return false;
  // Match unicode emoji and custom :emoji: patterns, whitespace between them
  return /^(\s*(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|<a?:[a-zA-Z0-9_]+:\d+>)\s*){1,3}$/u.test(stripped);
}

export async function renderMessageHtml(
  msg: NormalizedMessage,
  prev: NormalizedMessage | null,
  options: TranscriptOptions,
): Promise<string> {
  const strategy = options.media?.strategy;
  const parts: string[] = [];

  // System message
  if (msg.type === MessageType.System && msg.systemContent) {
    return `<div class="system-message" id="msg-${escHtml(msg.id)}">
      <span class="system-icon">ℹ️</span>
      <span>${escHtml(msg.systemContent)}</span>
    </div>`;
  }

  const continuation = isContinuation(msg, prev);

  // Avatar or spacer
  const avatarHtml = msg.author.avatarURL
    ? `<img class="avatar" src="${escHtml(msg.author.avatarURL)}" alt="${escHtml(msg.author.displayName)}" loading="lazy">`
    : `<div class="avatar" style="background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--text-muted);">${escHtml(msg.author.displayName.charAt(0).toUpperCase())}</div>`;

  const leftCol = continuation
    ? `<div class="avatar-spacer"></div>`
    : avatarHtml;

  // Message header (name + timestamp)
  let headerHtml = '';
  if (!continuation) {
    const nameColor = msg.author.roleColor ? ` style="color:${msg.author.roleColor}"` : '';
    const botBadge = msg.author.bot ? ` <span class="bot-badge">BOT</span>` : '';
    const edited = msg.editedTimestamp
      ? ` <span class="edited-tag" title="Edited ${formatDate(msg.editedTimestamp)}">(edited)</span>`
      : '';
    const ts = `<span class="timestamp" title="${msg.timestamp.toISOString()}">${formatDate(msg.timestamp)}</span>`;

    headerHtml = `<div class="message-header">
      <span class="author-name"${nameColor}>${escHtml(msg.author.displayName)}${botBadge}</span>
      ${ts}${edited}
    </div>`;
  }

  // Continuation timestamp (visible on hover via CSS)
  const continuationTs = continuation
    ? `<span class="continuation-timestamp">${msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>`
    : '';

  // Reply
  const replyHtml = msg.replyTo ? renderReplyBar(msg.replyTo) : '';

  // Content
  let contentHtml = '';
  if (msg.content) {
    const parsed = await parseDiscordMarkdown(msg.content);
    const emojiOnlyClass = isEmojiOnly(msg.content) ? ' emoji-only' : '';
    contentHtml = `<div class="message-content${emojiOnlyClass}">${parsed}</div>`;
  }

  // Stickers
  const stickersHtml = options.include?.stickers !== false && msg.stickers.length > 0
    ? msg.stickers.map((s) => renderSticker(s, strategy)).join('')
    : '';

  // Attachments
  const attachmentsHtml = msg.attachments.length > 0
    ? `<div class="attachments">${msg.attachments.map((a) => renderAttachment(a, strategy)).join('')}</div>`
    : '';

  // Embeds
  const embedsHtml = options.include?.embeds !== false && msg.embeds.length > 0
    ? `<div class="embeds">${msg.embeds.map(renderEmbed).join('')}</div>`
    : '';

  // Reactions
  const reactionsHtml = options.include?.reactions !== false
    ? renderReactions(msg.reactions)
    : '';

  return `<div class="message-group${continuation ? ' continuation' : ''}" id="msg-${escHtml(msg.id)}">
  ${continuationTs}
  ${leftCol}
  <div class="message-body">
    ${replyHtml}${headerHtml}${contentHtml}${stickersHtml}${attachmentsHtml}${embedsHtml}${reactionsHtml}
  </div>
</div>`;
}

export { formatDateShort };
