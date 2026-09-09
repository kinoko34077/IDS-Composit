/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import {
  initializePlayground,
  loadFullKnownIndexFromPages,
  type PlaygroundRenderer,
} from '../../examples/index';
import { PATTERN_CASES } from '../../examples/playground-model';
import { createKnownCharacterIndex } from '../../src/public-api';

async function flushUi(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('mobile playground UI', () => {
  it('renders the candidate catalog and lets a user submit an IDS source', async () => {
    const root = document.createElement('main');
    const render = vi.fn<PlaygroundRenderer>(async () => undefined);

    await initializePlayground(root, render);

    const input = root.querySelector<HTMLInputElement>('#ids-input');
    const candidate = root.querySelector<HTMLSelectElement>('#pattern-select');
    const form = root.querySelector<HTMLFormElement>('#ids-form');
    const tableRows = root.querySelectorAll('#pattern-table-body tr');

    expect(input).not.toBeNull();
    expect(candidate?.options).toHaveLength(PATTERN_CASES.length);
    expect(tableRows).toHaveLength(PATTERN_CASES.length);
    expect(root.querySelector<HTMLTableCellElement>('#pattern-table-body tr td code')?.textContent).toBe('⿰木可');
    expect(root.querySelector('#pattern-table-body')?.textContent).toContain('Known candidate（未検証）→ local composition');
    expect(root.querySelector('#pattern-table-body')?.textContent).toContain('Unsupported IDC → source preserved');
    expect(root.querySelector('thead')?.textContent).toContain('解決経路（目安）');
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

  it('loads the optional full index once and reports a Known native hit', async () => {
    const root = document.createElement('main');
    const render = vi.fn<PlaygroundRenderer>(async () => undefined);
    const knownIndex = createKnownCharacterIndex([{
      ids: '⿲彳圭亍',
      character: '街',
      source: 'BabelStone IDS',
      status: 'verified',
    }]);
    const loadFullKnownIndex = vi.fn(async () => knownIndex);

    await initializePlayground(root, render, loadFullKnownIndex);

    const input = root.querySelector<HTMLInputElement>('#ids-input');
    const mode = root.querySelector<HTMLSelectElement>('#resolution-mode');
    if (input === null || mode === null) throw new Error('Full Known controls are missing');

    input.value = '⿲彳圭亍';
    mode.value = 'full-known';
    mode.dispatchEvent(new Event('change'));
    await flushUi();
    await flushUi();

    expect(loadFullKnownIndex).toHaveBeenCalledTimes(1);
    expect(root.querySelector('#resolution-telemetry')?.textContent).toContain('hit: 街');
    expect(root.querySelector('#resolution-telemetry')?.textContent).toContain('not queried (Known hit)');
    expect(root.querySelector('#resolution-telemetry')?.textContent).toContain('native 街');
    expect(render.mock.calls.at(-1)?.[1]).toEqual(expect.objectContaining({
      chise: false,
      knownIndex,
    }));
  });

  it('hydrates the Pages asset through the explicit loader boundary', async () => {
    const artifact = {
      schemaVersion: 'ids-composit-known-records-merged/v0.2' as const,
      sources: [{ name: 'BabelStone IDS', version: 'fixture', retrievalMethod: 'fixture' }],
      records: [{ ids: '⿲彳圭亍', character: '街', status: 'verified' as const, sourceIndexes: [0] }],
    };
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => artifact,
    }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const index = await loadFullKnownIndexFromPages();
      expect(fetchMock).toHaveBeenCalledWith('./data/known-index-v0.2.json', { cache: 'no-store' });
      expect(index.resolve('⿲彳圭亍')).toEqual({ kind: 'match', character: '街' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
