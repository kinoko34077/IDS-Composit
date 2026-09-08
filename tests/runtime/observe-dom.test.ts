/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { observeIdsInElement } from '../../src/runtime/observe-dom';

async function flushObserver(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('observeIdsInElement', () => {
  it('coalesces same-callback additions to their common parent', async () => {
    const root = document.createElement('div');
    const renderedTargets: HTMLElement[] = [];
    const handle = observeIdsInElement(root, {
      render: async (target) => {
        renderedTargets.push(target);
      },
    });

    await flushObserver();
    renderedTargets.length = 0;

    for (let index = 0; index < 3; index += 1) {
      const child = document.createElement('span');
      child.textContent = `⟦⿰木${index === 0 ? '可' : '木'}⟧`;
      root.append(child);
    }
    await flushObserver();

    expect(renderedTargets).toEqual([root]);
    renderedTargets.length = 0;

    const renderedGlyph = document.createElement('span');
    renderedGlyph.className = 'ids-inline-glyph';
    root.append(renderedGlyph);
    await flushObserver();

    expect(renderedTargets).toHaveLength(0);
    handle.stop();
  });
});
