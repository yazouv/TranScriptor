import { BaseExporter, formatBytes, formatDate, formatDateShort } from '../base.js';
import { stripDiscordMarkdown } from '../../processors/markdown.js';
import { MessageType } from '../../types.js';
import type { NormalizedAttachment, NormalizedEmbed, NormalizedMessage, NormalizedReaction } from '../../types.js';
import { AttachmentType } from '../../types.js';

// ─── Markdown helpers ─────────────────────────────────────────────────────────

function mdEscape(text: string): string {
  // Escape characters that have special meaning in Markdown
  // Note: '.' and '-' are intentionally excluded — they only need escaping
  // in very specific list/HR contexts and cause noise in filenames/URLs
  return text.replace(/[\\`*_{}[\]<>()#+!|]/g, '\\$&');
}

function renderAttachmentMd(
  att: NormalizedAttachment,
  strategy: string | undefined,
): string {
  const label = mdEscape(att.filename);
  const url = att.resolvedUrl;
  const size = formatBytes(att.size);
  const spoilerTag = att.spoiler ? ' *(spoiler)*' : '';

  if (strategy === 'none') {
    return `> \`[${att.type.toUpperCase()}: ${label} (${size})${att.spoiler ? ' SPOILER' : ''}]\``;
  }

  if (att.type === AttachmentType.Image) {
    const prefix = att.spoiler ? '> ||' : '';
    const suffix = att.spoiler ? '||' : '';
    return `${prefix}![${label}](${url} "${label}")${suffix}${spoilerTag}`;
  }

  if (att.type === AttachmentType.Video) {
    return `> 🎬 **Video** — [${label}](${url}) *(${size})*${spoilerTag}`;
  }

  if (att.type === AttachmentType.Audio) {
    return `> 🎵 **Audio** — [${label}](${url}) *(${size})*`;
  }

  return `> 📎 [${label}](${url}) *(${size})*`;
}

function renderEmbedMd(embed: NormalizedEmbed): string {
  const lines: string[] = ['> '];

  if (embed.author) {
    lines.push(`> **${mdEscape(embed.author.name)}**`);
  }
  if (embed.title) {
    const title = embed.url
      ? `[${mdEscape(embed.title)}](${embed.url})`
      : `**${mdEscape(embed.title)}**`;
    lines.push(`> ${title}`);
  }
  if (embed.description) {
    // Indent each line of the description
    const desc = embed.description
      .slice(0, 300)
      .split('\n')
      .map((l) => `> ${l}`)
      .join('\n');
    lines.push(desc);
    if (embed.description.length > 300) lines.push('> *…*');
  }
  for (const field of embed.fields) {
    lines.push(`> **${mdEscape(field.name)}**: ${field.value}`);
  }
  if (embed.image) {
    lines.push(`> ![embed image](${embed.image.resolvedUrl})`);
  }
  if (embed.footer) {
    lines.push(`> *${mdEscape(embed.footer.text)}*`);
  }

  return lines.join('\n');
}

function renderReactionsMd(reactions: NormalizedReaction[]): string {
  if (reactions.length === 0) return '';
  const parts = reactions.map((r) => `${r.emoji} **${r.count}**`);
  return `> ${parts.join(' · ')}`;
}

// ─── Exporter ─────────────────────────────────────────────────────────────────

export class MarkdownExporter extends BaseExporter {
  protected renderHeader(): string {
    const guildName = this.channel.guild?.name ?? 'Unknown Server';
    const now = new Date();
    return [
      `# #${this.channel.name} — ${guildName}`,
      '',
      `> Exported on ${formatDate(now)}`,
      '',
      '---',
      '',
    ].join('\n');
  }

  protected renderFooter(): string {
    return [
      '',
      '---',
      '',
      `*${this.buildFooterText()}*`,
      '',
    ].join('\n');
  }

  protected async renderMessage(
    msg: NormalizedMessage,
    prev: NormalizedMessage | null,
  ): Promise<string> {
    const lines: string[] = [];
    const strategy = this.options.media?.strategy;

    // Day separator
    if (!prev || this.isDifferentDay(prev.timestamp, msg.timestamp)) {
      lines.push('');
      lines.push(`### ${formatDateShort(msg.timestamp)}`);
      lines.push('');
    }

    // System messages
    if (msg.type === MessageType.System && msg.systemContent) {
      lines.push(`*${mdEscape(msg.systemContent)}*`);
      lines.push('');
      return lines.join('\n');
    }

    // Message header — group consecutive messages from the same author
    const sameAuthor =
      prev &&
      prev.author.id === msg.author.id &&
      !this.isDifferentDay(prev.timestamp, msg.timestamp) &&
      msg.timestamp.getTime() - prev.timestamp.getTime() < 5 * 60 * 1000; // 5 min gap

    if (!sameAuthor) {
      const bot = msg.author.bot ? ' `BOT`' : '';
      const edited = msg.editedTimestamp ? ' *(edited)*' : '';
      lines.push(`**${mdEscape(msg.author.displayName)}**${bot} · ${formatDate(msg.timestamp)}${edited}`);
    } else if (msg.editedTimestamp) {
      lines.push(`*(edited at ${formatDate(msg.editedTimestamp)})*`);
    }

    // Reply reference
    if (msg.replyTo) {
      const preview = msg.replyTo.content.slice(0, 100);
      const ellipsis = msg.replyTo.content.length > 100 ? '…' : '';
      lines.push(`> ↩ **${mdEscape(msg.replyTo.author.displayName)}**: ${mdEscape(preview)}${ellipsis}`);
    }

    // Content
    if (msg.content) {
      const plain = await stripDiscordMarkdown(msg.content);
      lines.push(plain);
    }

    // Stickers
    for (const sticker of msg.stickers) {
      if (strategy === 'none') {
        lines.push(`> \`[Sticker: ${mdEscape(sticker.name)}]\``);
      } else {
        lines.push(`> 🎨 *Sticker: ${mdEscape(sticker.name)}*`);
        lines.push(`> ![${mdEscape(sticker.name)}](${sticker.resolvedUrl})`);
      }
    }

    // Attachments
    for (const att of msg.attachments) {
      lines.push(renderAttachmentMd(att, strategy));
    }

    // Embeds
    if (this.options.include?.embeds !== false) {
      for (const embed of msg.embeds) {
        lines.push(renderEmbedMd(embed));
      }
    }

    // Reactions
    if (this.options.include?.reactions !== false && msg.reactions.length > 0) {
      lines.push(renderReactionsMd(msg.reactions));
    }

    lines.push('');
    return lines.join('\n');
  }
}
