import type { RawMessage, TranscriptOptions } from '../types.js';

// Minimal channel interface — compatible with discord.js v14 and v15
// without importing the package directly
interface TextChannel {
  messages: {
    fetch(options: { limit: number; before?: string }): Promise<Map<string, RawMessage>>;
  };
  name: string;
  id: string;
}

const MAX_PER_REQUEST = 100; // Discord API hard limit

/**
 * Fetches all messages from a channel by paginating the Discord API.
 * Yields messages in chronological order (oldest to newest).
 */
export async function* fetchMessages(
  channel: TextChannel,
  options: Pick<TranscriptOptions, 'limit' | 'filter' | 'onProgress' | 'onWarning'>,
): AsyncGenerator<RawMessage> {
  const { limit = -1, filter, onProgress } = options;
  const unlimited = limit === -1;

  let lastId: string | undefined;
  let totalFetched = 0;
  // Buffer accumulates all pages before yielding in chronological order
  const buffer: RawMessage[] = [];

  while (true) {
    const remaining = unlimited
      ? MAX_PER_REQUEST
      : Math.min(MAX_PER_REQUEST, limit - totalFetched);

    if (remaining <= 0) break;

    let fetched: Map<string, RawMessage>;
    try {
      fetched = await channel.messages.fetch({
        limit: remaining,
        ...(lastId ? { before: lastId } : {}),
      });
    } catch (err) {
      options.onWarning?.(
        err instanceof Error ? err : new Error(String(err)),
        `fetchMessages — batch after ${lastId ?? 'start'}`,
      );
      break;
    }

    if (fetched.size === 0) break;

    // discord.js returns messages newest-first; sort by snowflake to get oldest-first
    const sorted = [...fetched.values()].sort(
      (a: RawMessage, b: RawMessage) => Number(BigInt(a.id) - BigInt(b.id)),
    );

    buffer.push(...sorted);
    totalFetched += fetched.size;
    // Use the oldest message in this batch as the cursor for the next page
    lastId = sorted[0]?.id;

    onProgress?.({
      processed: totalFetched,
      total: unlimited ? null : limit,
      phase: 'fetching',
    });

    if (fetched.size < remaining) break; // Last page reached
  }

  // Batches were fetched newest-to-oldest, so reverse to get chronological order
  buffer.reverse();

  for (const msg of buffer) {
    if (filter && !filter(msg)) continue;
    yield msg;
  }
}
