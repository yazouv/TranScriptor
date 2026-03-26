/**
 * Splits an AsyncIterable<T> into batches of size N.
 * Used to process messages in chunks without loading everything into memory.
 */
export async function* chunk<T>(
  source: AsyncIterable<T>,
  size: number,
): AsyncGenerator<T[]> {
  let batch: T[] = [];

  for await (const item of source) {
    batch.push(item);
    if (batch.length >= size) {
      yield batch;
      batch = [];
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}

/**
 * Converts an array into an AsyncIterable of batches.
 * Useful for generateFromMessages() which already has all messages upfront.
 */
export async function* chunkArray<T>(
  items: T[],
  size: number,
): AsyncGenerator<T[]> {
  for (let i = 0; i < items.length; i += size) {
    yield items.slice(i, i + size);
  }
}
