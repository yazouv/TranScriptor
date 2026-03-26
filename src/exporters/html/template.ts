/**
 * Inlined CSS and HTML shell for the HTML exporter.
 * Inspired by Discord's UI — dark theme with CSS variables for light mode support.
 */

export const CSS = `
:root {
  --bg-primary: #313338;
  --bg-secondary: #2b2d31;
  --bg-tertiary: #1e1f22;
  --bg-hover: #35373c;
  --text-primary: #dbdee1;
  --text-secondary: #949ba4;
  --text-muted: #6d6f78;
  --text-link: #00a8fc;
  --brand: #5865f2;
  --mention-bg: rgba(88,101,242,0.15);
  --mention-color: #c9cdfb;
  --blockquote-bar: #4e5058;
  --embed-bg: #2b2d31;
  --embed-border: #1e1f22;
  --code-bg: #2b2d31;
  --reaction-bg: #383a40;
  --reaction-active-bg: rgba(88,101,242,0.25);
  --spoiler-bg: #202225;
  --spoiler-revealed: transparent;
  --separator: #3f4147;
  --bot-badge: #5865f2;
  --timestamp-color: #949ba4;
  --font-sans: "gg sans", "Noto Sans", Whitney, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
  --font-mono: "Cascadia Code", "Consolas", "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", monospace;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f2f3f5;
    --bg-tertiary: #e3e5e8;
    --bg-hover: #eaebee;
    --text-primary: #2e3338;
    --text-secondary: #4e5058;
    --text-muted: #747f8d;
    --blockquote-bar: #c4c9ce;
    --embed-bg: #f2f3f5;
    --embed-border: #e3e5e8;
    --code-bg: #f2f3f5;
    --reaction-bg: #e3e5e8;
    --separator: #e3e5e8;
    --spoiler-bg: #cdd0d4;
    --timestamp-color: #747f8d;
  }
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.375;
}

a { color: var(--text-link); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ── Layout ── */
.transcript {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

/* ── Header ── */
.transcript-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--separator);
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.transcript-header .guild-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
.transcript-header .channel-info { flex: 1; }
.transcript-header .channel-name {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.transcript-header .channel-name .hash {
  color: var(--text-secondary);
  font-size: 20px;
}
.transcript-header .guild-name {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.transcript-header .message-count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: 12px;
}

/* ── Day separator ── */
.day-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 8px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}
.day-separator::before,
.day-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--separator);
}

/* ── Messages ── */
.message-group {
  display: flex;
  gap: 16px;
  padding: 4px 16px;
  border-radius: 4px;
  position: relative;
}
.message-group:hover { background: var(--bg-hover); }
.message-group.continuation { padding-top: 1px; padding-bottom: 1px; }

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  margin-top: 2px;
}
.avatar-spacer { width: 40px; flex-shrink: 0; }

.message-body { flex: 1; min-width: 0; }

.message-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}
.author-name {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.375;
  cursor: pointer;
}
.author-name:hover { text-decoration: underline; }
.bot-badge {
  background: var(--bot-badge);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  vertical-align: middle;
}
.timestamp {
  font-size: 12px;
  color: var(--timestamp-color);
  cursor: default;
}
.edited-tag {
  font-size: 10px;
  color: var(--text-muted);
}

.message-content {
  font-size: 16px;
  line-height: 1.375;
  word-break: break-word;
  white-space: pre-wrap;
}
.message-content.emoji-only { font-size: 32px; }

/* ── Continuation timestamp (shown on hover) ── */
.continuation-timestamp {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0;
  width: 40px;
  text-align: right;
  pointer-events: none;
}
.message-group.continuation:hover .continuation-timestamp { opacity: 1; }

/* ── Reply ── */
.reply-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 14px;
  color: var(--text-secondary);
}
.reply-bar::before {
  content: '';
  width: 28px;
  height: 12px;
  border-top: 2px solid var(--text-muted);
  border-left: 2px solid var(--text-muted);
  border-top-left-radius: 6px;
  flex-shrink: 0;
}
.reply-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
}
.reply-author { font-weight: 500; font-size: 14px; }
.reply-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
  color: var(--text-secondary);
  font-size: 14px;
}
.reply-content:hover { color: var(--text-primary); text-decoration: underline; cursor: pointer; }

/* ── System messages ── */
.system-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  color: var(--text-muted);
  font-size: 14px;
  font-style: italic;
}
.system-message .system-icon { font-size: 16px; }

/* ── Inline markdown ── */
strong { font-weight: 700; }
em { font-style: italic; }
u { text-decoration: underline; }
s { text-decoration: line-through; }

code.inline-code {
  background: var(--code-bg);
  border: 1px solid var(--separator);
  border-radius: 3px;
  padding: 0 4px;
  font-family: var(--font-mono);
  font-size: 14px;
}

pre {
  background: var(--code-bg);
  border: 1px solid var(--separator);
  border-radius: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  margin: 4px 0;
}
pre code.code-block {
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
}

.blockquote {
  display: flex;
  gap: 12px;
  margin: 4px 0;
}
.blockquote-bar {
  width: 4px;
  border-radius: 4px;
  background: var(--blockquote-bar);
  flex-shrink: 0;
}
.blockquote-content { flex: 1; }

.mention {
  background: var(--mention-bg);
  color: var(--mention-color);
  border-radius: 3px;
  padding: 0 2px;
  font-weight: 500;
  cursor: pointer;
}
.mention:hover { background: var(--brand); color: #fff; }

.spoiler {
  background: var(--spoiler-bg);
  color: transparent;
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
}
.spoiler.revealed {
  background: var(--spoiler-revealed);
  color: inherit;
}

.emoji { display: inline; }
.emoji.custom-emoji {
  width: 22px;
  height: 22px;
  vertical-align: middle;
  object-fit: contain;
}

/* ── Attachments ── */
.attachments { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }

.attachment-image-wrap { display: inline-block; position: relative; }
.attachment-image-wrap.spoiler img { filter: blur(40px); cursor: pointer; }
.attachment-image-wrap.spoiler.revealed img { filter: none; }

.attachment-image {
  max-width: 520px;
  max-height: 350px;
  border-radius: 4px;
  display: block;
  object-fit: contain;
  cursor: zoom-in;
}

.attachment-video {
  max-width: 520px;
  max-height: 350px;
  border-radius: 4px;
  display: block;
}

audio.attachment-audio { display: block; max-width: 400px; margin-top: 4px; }

.attachment-file {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: var(--embed-bg);
  border: 1px solid var(--embed-border);
  border-radius: 4px;
  padding: 10px 14px;
  text-decoration: none;
  max-width: 520px;
}
.attachment-file:hover { background: var(--bg-hover); }
.attachment-file-icon { font-size: 28px; line-height: 1; }
.attachment-file-info { display: flex; flex-direction: column; min-width: 0; }
.attachment-file-name {
  color: var(--text-link);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.attachment-file-size { font-size: 12px; color: var(--text-muted); }

/* ── Embeds ── */
.embeds { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; }

.embed {
  display: flex;
  background: var(--embed-bg);
  border: 1px solid var(--embed-border);
  border-radius: 4px;
  border-left: 4px solid var(--blockquote-bar);
  overflow: hidden;
  max-width: 520px;
}
.embed-color-bar { width: 4px; flex-shrink: 0; margin: -1px -4px -1px 0; border-radius: 4px 0 0 4px; }
.embed-body { padding: 12px 16px; flex: 1; min-width: 0; }
.embed-thumbnail {
  padding: 12px;
  flex-shrink: 0;
}
.embed-thumbnail img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}

.embed-author {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
}
.embed-author img { width: 20px; height: 20px; border-radius: 50%; }

.embed-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}
.embed-title a { color: var(--text-link); }

.embed-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.embed-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.embed-field { min-width: 0; }
.embed-field.inline { flex: 1; min-width: 120px; }
.embed-field-name { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.embed-field-value { font-size: 14px; color: var(--text-secondary); white-space: pre-wrap; }

.embed-image { margin-top: 8px; }
.embed-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  object-fit: contain;
  display: block;
}

.embed-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
.embed-footer img { width: 16px; height: 16px; border-radius: 50%; }

/* ── Reactions ── */
.reactions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.reaction {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--reaction-bg);
  border-radius: 8px;
  padding: 3px 8px;
  font-size: 14px;
  cursor: default;
}
.reaction img { width: 18px; height: 18px; object-fit: contain; }
.reaction-count { font-size: 13px; font-weight: 600; color: var(--text-secondary); }

/* ── Stickers ── */
.sticker { margin-top: 4px; }
.sticker img { max-width: 160px; max-height: 160px; object-fit: contain; }

/* ── Footer ── */
.transcript-footer {
  margin-top: 32px;
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
  border-top: 1px solid var(--separator);
}

/* ── Image lightbox ── */
#lightbox {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}
#lightbox.open { display: flex; }
#lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 4px; }
`;

export const CLIENT_SCRIPT = `
document.querySelectorAll('.spoiler').forEach(el => {
  el.addEventListener('click', () => el.classList.toggle('revealed'));
});

document.querySelectorAll('.attachment-image-wrap.spoiler').forEach(wrap => {
  wrap.addEventListener('click', () => wrap.classList.toggle('revealed'));
});

const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox && lightbox.querySelector('img');
if (lightbox && lightboxImg) {
  document.querySelectorAll('.attachment-image').forEach(img => {
    img.addEventListener('click', e => {
      e.stopPropagation();
      lightboxImg.src = img.src;
      lightbox.classList.add('open');
    });
  });
  lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') lightbox.classList.remove('open');
  });
}

document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', () => {
    const target = document.getElementById('msg-' + el.dataset.goto);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.style.background = 'rgba(88,101,242,0.2)';
    setTimeout(() => target.style.background = '', 1500);
  });
});
`;

export function buildHtmlShell(
  channelName: string,
  guildName: string,
  guildIconURL: string | null,
  messageCount: number,
  footerText: string,
): { header: string; footer: string } {
  const icon = guildIconURL
    ? `<img class="guild-icon" src="${guildIconURL}" alt="${escHtml(guildName)}" loading="lazy">`
    : `<div class="guild-icon" style="background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:18px;">💬</div>`;

  const header = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>#${escHtml(channelName)} — ${escHtml(guildName)}</title>
  <style>${CSS}</style>
</head>
<body>
<div id="lightbox"><img src="" alt=""></div>
<header class="transcript-header">
  ${icon}
  <div class="channel-info">
    <div class="channel-name"><span class="hash">#</span>${escHtml(channelName)}</div>
    <div class="guild-name">${escHtml(guildName)}</div>
  </div>
  <span class="message-count">${messageCount} messages</span>
</header>
<div class="transcript">
`;

  const footer = `</div>
<footer class="transcript-footer">${escHtml(footerText)}</footer>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>`;

  return { header, footer };
}

export function escHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
