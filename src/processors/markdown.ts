// discord-markdown-parser uses CommonJS — dynamic import handles ESM interop
// We wrap it here so the rest of the codebase stays clean

interface MarkdownNode {
  type: string;
  content?: string | MarkdownNode[];
  id?: string;
  name?: string;
  animated?: boolean;
  timestamp?: string;
  format?: string;
}

let parser: ((input: string) => MarkdownNode[]) | null = null;

async function getParser(): Promise<(input: string) => MarkdownNode[]> {
  if (parser) return parser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('discord-markdown-parser' as any);
  parser = mod.default ?? mod;
  return parser!;
}

// ─── Node → plain text ────────────────────────────────────────────────────────

function nodeToText(node: MarkdownNode): string {
  if (typeof node.content === 'string') return node.content;
  if (Array.isArray(node.content)) return node.content.map(nodeToText).join('');
  return '';
}

function nodesToText(nodes: MarkdownNode[]): string {
  return nodes.map(nodeToText).join('');
}

// ─── Node → HTML ──────────────────────────────────────────────────────────────

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders an array of nodes to HTML, merging the 5-node masked-link pattern:
 *   text("[display")  text("]")  text("(")  url  text(")")
 * into a single <a> element, since discord-markdown-parser doesn't produce
 * a unified link node for Discord's [text](url) format.
 */
function renderNodes(nodes: MarkdownNode[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < nodes.length) {
    // Detect: text("[...") + text("]") + text("(") + url + text(")")
    const n0 = nodes[i];
    const n1 = nodes[i + 1];
    const n2 = nodes[i + 2];
    const n3 = nodes[i + 3];
    const n4 = nodes[i + 4];
    if (
      n0 !== undefined && n1 !== undefined && n2 !== undefined &&
      n3 !== undefined && n4 !== undefined &&
      n0.type === 'text' &&
      typeof n0.content === 'string' &&
      (n0.content as string).startsWith('[') &&
      n1.type === 'text' && n1.content === ']' &&
      n2.type === 'text' && n2.content === '(' &&
      n3.type === 'url' &&
      n4.type === 'text' && n4.content === ')'
    ) {
      const displayText = escape((n0.content as string).slice(1)); // strip leading [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const href = escape(String((n3 as any).target ?? n3.content ?? ''));
      out.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${displayText}</a>`);
      i += 5;
      continue;
    }
    if (n0 !== undefined) out.push(nodeToHTML(n0));
    i++;
  }
  return out.join('');
}

function nodeToHTML(node: MarkdownNode): string {
  const inner = Array.isArray(node.content)
    ? renderNodes(node.content)
    : escape(String(node.content ?? ''));

  switch (node.type) {
    case 'text':
      return escape(String(node.content ?? ''));

    case 'strong':
      return `<strong>${inner}</strong>`;

    case 'em':
      return `<em>${inner}</em>`;

    case 'underline':
      return `<u>${inner}</u>`;

    case 's':
    case 'del':
      return `<s>${inner}</s>`;

    case 'inlineCode':
      return `<code class="inline-code">${escape(String(node.content ?? ''))}</code>`;

    case 'codeBlock': {
      const lang = (node as { lang?: string }).lang ?? '';
      return `<pre><code class="code-block${lang ? ` language-${escape(lang)}` : ''}">${escape(String(node.content ?? ''))}</code></pre>`;
    }

    case 'blockQuote':
      return `<div class="blockquote"><div class="blockquote-bar"></div><div class="blockquote-content">${inner}</div></div>`;

    case 'spoiler':
      return `<span class="spoiler" data-spoiler="true">${inner}</span>`;

    case 'url':
    case 'autolink': {
      // content may be a string (plain URL) or an array of child nodes (masked link)
      const href = typeof node.content === 'string'
        ? escape(node.content)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : escape(String((node as any).target ?? (node as any).url ?? ''));
      const display = inner || href;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${display}</a>`;
    }

    // Discord masked links: [display text](url)
    case 'link': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const href = escape(String((node as any).target ?? (node as any).url ?? ''));
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
    }

    // Discord headings (##, ###)
    case 'heading': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const level = Math.min(Math.max(Number((node as any).level ?? 2), 1), 3);
      return `<h${level} class="discord-heading">${inner}</h${level}>`;
    }

    case 'br':
    case 'newline':
      return '<br>';

    // Discord mentions
    case 'userMention':
      return `<span class="mention">@${escape(String(node.id ?? 'unknown'))}</span>`;

    case 'roleMention':
      return `<span class="mention role-mention">@${escape(String(node.id ?? 'unknown'))}</span>`;

    case 'channelMention':
      return `<span class="mention">#${escape(String(node.id ?? 'unknown'))}</span>`;

    case 'everyone':
      return `<span class="mention">@everyone</span>`;

    case 'here':
      return `<span class="mention">@here</span>`;

    // Custom emoji
    case 'emoji': {
      const animated = node.animated ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${node.id}.${animated}?size=32`;
      return `<img class="emoji custom-emoji" src="${url}" alt=":${escape(String(node.name ?? ''))}:" title=":${escape(String(node.name ?? ''))}:">`;
    }

    // Unicode emoji — let the browser render it natively
    // Note: discord-markdown-parser stores the emoji character in `name`, not `content`
    case 'twemoji':
      return `<span class="emoji">${escape(String(node.name ?? node.content ?? ''))}</span>`;

    // Discord timestamp <t:unix:format>
    case 'timestamp': {
      const ts = Number(node.timestamp ?? 0);
      const date = new Date(ts * 1000);
      return `<span class="timestamp" title="${escape(date.toISOString())}">${escape(date.toLocaleString())}</span>`;
    }

    default:
      return inner || escape(String(node.content ?? ''));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses Discord markdown content and returns an HTML string.
 * Uses discord-markdown-parser under the hood.
 */
export async function parseDiscordMarkdown(content: string): Promise<string> {
  if (!content.trim()) return '';

  try {
    const parse = await getParser();
    const nodes = parse(content);
    return renderNodes(nodes);
  } catch {
    // If parsing fails for any reason, return escaped plain text
    return escape(content);
  }
}

/**
 * Strips Discord markdown and returns plain text.
 * Used by TXT exporter.
 */
export async function stripDiscordMarkdown(content: string): Promise<string> {
  if (!content.trim()) return content;

  try {
    const parse = await getParser();
    const nodes = parse(content);
    return nodesToText(nodes);
  } catch {
    return content;
  }
}
