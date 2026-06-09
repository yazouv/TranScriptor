import { BaseExporter, formatDateShort, type ChannelInfo } from '../base.js';
import { buildHtmlShell, escHtml } from './template.js';
import { renderMessageHtml } from './renderer.js';
import type { NormalizedMessage, TranscriptOptions } from '../../types.js';

export class HtmlExporter extends BaseExporter {
  private guildIconURL: string | null = null;
  // Deferred: we don't know the message count at header-write time,
  // so we use a placeholder and replace it in the footer pass.
  private pendingMessageCount = 0;

  constructor(channel: ChannelInfo, options: TranscriptOptions) {
    super(channel, options);
    // Attempt to resolve guild icon (64px)
    this.guildIconURL = channel.guild?.iconURL?.({ size: 64 }) ?? null;
  }

  protected renderHeader(): string {
    const guildName = this.channel.guild?.name ?? 'Unknown Server';
    // We write the header before processing messages, so messageCount is 0.
    // The count in the header badge will be updated client-side via JS after export,
    // or simply left as-is (acceptable for a static transcript).
    const { header } = buildHtmlShell(
      this.channel.name,
      guildName,
      this.guildIconURL,
      0, // placeholder — updated in footer
      '',
    );
    return header;
  }

  protected renderFooter(): string {
    const guildName = this.channel.guild?.name ?? 'Unknown Server';
    const { footer } = buildHtmlShell(
      this.channel.name,
      guildName,
      this.guildIconURL,
      this.messageCount,
      this.buildFooterText(),
    );

    // Patch the message count in the already-written header via an inline script
    const patchScript = `<script>
  var el = document.querySelector('.message-count');
  if (el) el.textContent = '${this.messageCount} messages';
</script>`;

    // Close the current section (main or last thread) before the transcript wrapper closes
    return patchScript + '</div>\n' + footer;
  }

  protected renderThreadSeparator(threadId: string, threadName: string): string {
    // Close the previous section, open a new hidden section for this thread.
    // The tab bar JS will add a tab button pointing to this section's id.
    const sectionId = `section-${threadId.replace(/[^a-z0-9_-]/gi, '-')}`;
    return `</div>\n<div id="${sectionId}" class="transcript-section hidden" data-name="${escHtml(threadName)}" role="tabpanel">\n`;
  }

  protected async renderMessage(
    msg: NormalizedMessage,
    prev: NormalizedMessage | null,
  ): Promise<string> {
    const parts: string[] = [];

    // Day separator
    if (!prev || this.isDifferentDay(prev.timestamp, msg.timestamp)) {
      parts.push(`<div class="day-separator">${escHtml(formatDateShort(msg.timestamp))}</div>`);
    }

    parts.push(await renderMessageHtml(msg, prev, this.options));

    return parts.join('\n');
  }
}
