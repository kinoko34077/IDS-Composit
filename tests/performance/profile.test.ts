/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createChiseProvider } from '../../src/chise/chise-provider';
import type { FetchLike } from '../../src/chise/types';
import { renderIds } from '../../src/public-api';

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
});
