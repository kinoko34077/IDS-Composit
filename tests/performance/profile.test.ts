/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createChiseProvider } from '../../src/chise/chise-provider';
import type { FetchLike } from '../../src/chise/types';
import { observeIds, renderIds } from '../../src/public-api';

async function flushObserver(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('Phase 9 performance profile', () => {
  it('profiles a large local text-node corpus without losing IDS segments', async () => {
    const root = document.createElement('div');
    for (let index = 0; index < 100; index += 1) {
      const paragraph = document.createElement('p');
      paragraph.textContent = `before ${index} ⟦⿰木可⟧ middle ⟦⿱日月⟧ after`;
      root.append(paragraph);
    }

    const startedAt = performance.now();
    await renderIds(root);
    const elapsedMs = performance.now() - startedAt;

    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(200);
    console.info(`[profile] local: 100 text nodes / 200 IDS -> ${elapsedMs.toFixed(2)} ms`);
  });

  it('profiles CHISE cache hit/miss behavior without duplicate requests', async () => {
    const fetcher = vi.fn<FetchLike>().mockImplementation(async () => new Response('null', { status: 200 }));
    const provider = createChiseProvider({ fetch: fetcher });
    const root = document.createElement('div');
    for (let index = 0; index < 50; index += 1) {
      const paragraph = document.createElement('p');
      paragraph.textContent = '⟦⿰木可⟧ ⟦⿱日月⟧';
      root.append(paragraph);
    }

    const startedAt = performance.now();
    await renderIds(root, { provider });
    const elapsedMs = performance.now() - startedAt;

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(100);
    console.info(`[profile] CHISE: 100 IDS / 2 cache misses -> ${elapsedMs.toFixed(2)} ms`);
  });

  it('profiles 100 and 1000 local IDS rendering', async () => {
    for (const count of [100, 1000]) {
      const root = document.createElement('div');
      root.textContent = Array.from({ length: count }, () => '⟦⿰木可⟧').join(' ');

      const startedAt = performance.now();
      await renderIds(root);
      const elapsedMs = performance.now() - startedAt;

      expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(count);
      console.info(`[profile] local: ${count} IDS -> ${elapsedMs.toFixed(2)} ms`);
    }
  }, 20_000);

  it('profiles 10 and 100 unique CHISE resolutions', async () => {
    for (const count of [10, 100]) {
      const fetcher = vi.fn<FetchLike>().mockImplementation(async () => new Response('null', { status: 200 }));
      const provider = createChiseProvider({ fetch: fetcher });
      const sources = Array.from({ length: count }, (_, index) => `⿰木${String.fromCodePoint(0x4e00 + index)}`);

      const startedAt = performance.now();
      await Promise.all(sources.map((source) => provider.matchIds(source)));
      const elapsedMs = performance.now() - startedAt;

      expect(fetcher).toHaveBeenCalledTimes(count);
      console.info(`[profile] CHISE: ${count} unique resolutions -> ${elapsedMs.toFixed(2)} ms`);
    }
  });

  it('profiles 100 observer additions', async () => {
    const root = document.createElement('div');
    const handle = observeIds(root);
    await flushObserver();

    const startedAt = performance.now();
    for (let index = 0; index < 100; index += 1) {
      const node = document.createElement('span');
      node.textContent = '⟦⿰木可⟧';
      root.append(node);
    }
    await flushObserver();
    const elapsedMs = performance.now() - startedAt;

    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(100);
    handle.stop();
    console.info(`[profile] observer: 100 dynamic additions -> ${elapsedMs.toFixed(2)} ms`);
  });
});
