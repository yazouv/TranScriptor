import { describe, it, expect } from 'vitest';
import { chunk, chunkArray } from '../src/fetcher/chunker.js';

// ─── chunk (AsyncIterable → batches) ─────────────────────────────────────────

async function collect<T>(gen: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of gen) result.push(item);
  return result;
}

async function* toAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) yield item;
}

describe('chunk', () => {
  it('splits items into batches of the given size', async () => {
    const batches = await collect(chunk(toAsyncIterable([1, 2, 3, 4, 5]), 2));
    expect(batches).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('yields a single batch when all items fit', async () => {
    const batches = await collect(chunk(toAsyncIterable([1, 2, 3]), 10));
    expect(batches).toEqual([[1, 2, 3]]);
  });

  it('yields nothing for an empty iterable', async () => {
    const batches = await collect(chunk(toAsyncIterable([]), 5));
    expect(batches).toEqual([]);
  });

  it('yields one-item batches when size is 1', async () => {
    const batches = await collect(chunk(toAsyncIterable(['a', 'b', 'c']), 1));
    expect(batches).toEqual([['a'], ['b'], ['c']]);
  });

  it('yields a single batch when item count equals size exactly', async () => {
    const batches = await collect(chunk(toAsyncIterable([10, 20, 30]), 3));
    expect(batches).toEqual([[10, 20, 30]]);
  });

  it('works with string items', async () => {
    const batches = await collect(chunk(toAsyncIterable(['x', 'y', 'z', 'w']), 3));
    expect(batches).toEqual([['x', 'y', 'z'], ['w']]);
  });
});

// ─── chunkArray ────────────────────────────────────────────────────────────────

describe('chunkArray', () => {
  it('splits an array into batches of the given size', async () => {
    const batches = await collect(chunkArray([1, 2, 3, 4, 5], 2));
    expect(batches).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('yields a single batch when all items fit', async () => {
    const batches = await collect(chunkArray([1, 2], 10));
    expect(batches).toEqual([[1, 2]]);
  });

  it('yields nothing for an empty array', async () => {
    const batches = await collect(chunkArray([], 5));
    expect(batches).toEqual([]);
  });

  it('yields one-item batches when size is 1', async () => {
    const batches = await collect(chunkArray(['a', 'b', 'c'], 1));
    expect(batches).toEqual([['a'], ['b'], ['c']]);
  });

  it('yields a single batch when array length equals size', async () => {
    const batches = await collect(chunkArray([7, 8, 9], 3));
    expect(batches).toEqual([[7, 8, 9]]);
  });

  it('preserves item order within each batch', async () => {
    const input = [10, 20, 30, 40, 50, 60];
    const batches = await collect(chunkArray(input, 4));
    expect(batches[0]).toEqual([10, 20, 30, 40]);
    expect(batches[1]).toEqual([50, 60]);
  });
});
