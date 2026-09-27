/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { initializePlayground, type PlaygroundRenderer } from '../../examples/index';

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function flushUi(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('mobile playground initial table lifecycle', () => {
  it('typing while the initial table render is in flight does not discard the table commit', async () => {
    const root = document.createElement('main');
    const pendingRender = deferred<void>();
    const renderer = vi.fn<PlaygroundRenderer>(async (target) => {
      await pendingRender.promise;
      const marker = target.ownerDocument.createElement('i');
      marker.textContent = 'TABLE-RENDERED';
      target.append(marker);
    });

    const initialization = initializePlayground(root, renderer);
    await flushUi();

    const input = root.querySelector<HTMLInputElement>('#ids-input');
    if (input === null) throw new Error('IDS input is missing');
    input.value = '⿰木可';
    input.dispatchEvent(new Event('input'));

    pendingRender.resolve();
    await initialization;

    expect(root.querySelector('#pattern-table-body')?.textContent).toContain('TABLE-RENDERED');
    expect(renderer).toHaveBeenCalledTimes(1);
  });
});
