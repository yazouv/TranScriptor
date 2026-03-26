import { BaseExporter, formatBytes, formatDateISO, formatDateShort } from '../base.js';
import { stripDiscordMarkdown } from '../../processors/markdown.js';
import { MessageType } from '../../types.js';
import type { NormalizedMessage } from '../../types.js';

export class TxtExporter extends BaseExporter {
  protected renderHeader(): string {
    const guildName = this.channel.guild?.name ?? 'Unknown Server';
    const now = new Date();
    const lines = [
      '='.repeat(60),
      `  Channel : #${this.channel.name}`,
      `  Server  : ${guildName}`,
      `  Exported: ${formatDateISO(now)}`,
      '='.repeat(60),
      '',
    ];
    return lines.join('\n');
  }

  protected renderFooter(): string {
    return [
      '',
      '='.repeat(60),
      `  ${this.buildFooterText()}`,
      '='.repeat(60),
      '',
    ].join('\n');
  }

  protected async renderMessage(
    msg: NormalizedMessage,
    prev: NormalizedMessage | null,
  ): Promise<string> {
    const lines: string[] = [];

    // Day separator
    if (!prev || this.isDifferentDay(prev.timestamp, msg.timestamp)) {
      lines.push('');
      lines.push(`── ${formatDateShort(msg.timestamp)} ${'─'.repeat(40)}`);
      lines.push('');
    }

    // System messages
    if (msg.type === MessageType.System && msg.systemContent) {
      lines.push(`  [${formatDateISO(msg.timestamp)}] *** ${msg.systemContent} ***`);
      lines.push('');
      return lines.join('\n');
    }

    // Message header
    const edited = msg.editedTimestamp ? ' (edited)' : '';
    const bot = msg.author.bot ? ' [BOT]' : '';
    lines.push(`[${formatDateISO(msg.timestamp)}${edited}] ${msg.author.displayName}${bot}:`);

    // Reply reference
    if (msg.replyTo) {
      const replyPreview = msg.replyTo.content.slice(0, 80);
      const ellipsis = msg.replyTo.content.length > 80 ? '…' : '';
      lines.push(`  ↩ Replying to ${msg.replyTo.author.displayName}: ${replyPreview}${ellipsis}`);
    }

    // Content
    if (msg.content) {
      const plain = await stripDiscordMarkdown(msg.content);
      // Indent continuation lines
      const indented = plain
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n');
      lines.push(indented);
    }

    // Stickers
    for (const sticker of msg.stickers) {
      lines.push(`  [Sticker: ${sticker.name}]`);
    }

    // Attachments
    for (const att of msg.attachments) {
      const size = formatBytes(att.size);
      const spoiler = att.spoiler ? ' [SPOILER]' : '';
      lines.push(`  [${att.type.toUpperCase()}: ${att.filename} (${size})${spoiler}]`);
      if (this.options.media?.strategy !== 'none') {
        lines.push(`  → ${att.resolvedUrl}`);
      }
    }

    // Embeds
    if (this.options.include?.embeds !== false) {
      for (const embed of msg.embeds) {
        const parts: string[] = [];
        if (embed.title) parts.push(embed.title);
        if (embed.description) parts.push(embed.description.slice(0, 100));
        lines.push(`  [Embed${parts.length ? ': ' + parts.join(' — ') : ''}]`);
      }
    }

    // Reactions
    if (this.options.include?.reactions !== false && msg.reactions.length > 0) {
      const reactionStr = msg.reactions
        .map((r) => `${r.emoji} ${r.count}`)
        .join('  ');
      lines.push(`  Reactions: ${reactionStr}`);
    }

    lines.push('');
    return lines.join('\n');
  }
}
