/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { initializePlayground } from '../../examples/index';

async function flushUi(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('mobile playground UI', () => {
  it('renders the candidate catalog and lets a user submit an IDS source', async () => {
    const root = document.createElement('main');
    const render = vi.fn(async () => undefined);

    await initializePlayground(root, render);

    const input = root.querySelector<HTMLInputElement>('#ids-input');
    const candidate = root.querySelector<HTMLSelectElement>('#pattern-select');
    const form = root.querySelector<HTMLFormElement>('#ids-form');
    const tableRows = root.querySelectorAll('#pattern-table-body tr');

    expect(input).not.toBeNull();
    expect(candidate?.options).toHaveLength(10);
    expect(tableRows).toHaveLength(10);
    expect(root.querySelector<HTMLTableCellElement>('#pattern-table-body tr td code')?.textContent).toBe('⿰木可');
    expect(render).toHaveBeenCalledTimes(1);

    if (input === null || candidate === null || form === null) throw new Error('Playground controls are missing');
    candidate.value = 'nested';
    candidate.dispatchEvent(new Event('change'));
    expect(input.value).toBe('⿰木⿱日月');

    input.value = '⿰木可';
    form.requestSubmit();
    await flushUi();

    expect(root.querySelector('#preview')?.textContent).toBe('⟦⿰木可⟧');
    expect(render).toHaveBeenCalledTimes(3);
  });

  it('reports a renderer failure without rejecting page initialization', async () => {
    const root = document.createElement('main');
    const render = vi.fn(async () => {
      throw new Error('renderer unavailable');
    });

    await expect(initializePlayground(root, render)).resolves.toBeUndefined();

    expect(root.querySelector('#status')?.textContent).toContain('renderer unavailable');
    expect(root.querySelector('#status')?.getAttribute('data-status')).toBe('error');
  });
});
