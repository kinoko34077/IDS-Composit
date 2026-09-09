/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { createKnownCharacterIndex } from '../../src/known';
import { observeIds, renderIds, type IdsObserverHandle } from '../../src/public-api';

async function flushObserver(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('renderIds', () => {
  it('keeps the observer handle type public', () => {
    const handle: IdsObserverHandle = { stop() {} };
    expect(handle.stop).toBeTypeOf('function');
  });

  it('renders a native provider result without exposing parser details', async () => {
    const root = document.createElement('p');
    root.textContent = 'A⟦⿰木可⟧B';

    await renderIds(root, { provider: { matchIds: async () => ({ found: true, text: '字' }) } });

    expect(root.textContent).toBe('A字B');
    expect(root.querySelector('.ids-inline-glyph')).toBeNull();
  });

  it('uses a Known Index native result before local parsing', async () => {
    const root = document.createElement('p');
    root.textContent = '⟦⿾木可⟧';
    const knownIndex = createKnownCharacterIndex([{
      ids: '⿾木可',
      character: '異',
      source: 'external fixture',
      sourceVersion: 'test',
      status: 'verified',
    }]);

    await renderIds(root, { knownIndex });

    expect(root.textContent).toBe('異');
    expect(root.querySelector('.ids-inline-glyph')).toBeNull();
  });

  it('falls through from an explicit provider miss to CHISE when enabled', async () => {
    const root = document.createElement('p');
    root.textContent = '⟦⿾木可⟧';
    const explicitProvider = { matchIds: async () => ({ found: false } as const) };
    const fetcher = async () => new Response(JSON.stringify('異'), { status: 200 });

    await renderIds(root, {
      provider: explicitProvider,
      chise: true,
      chiseOptions: { fetch: fetcher, endpoint: 'https://example.test/ids-match' },
    });

    expect(root.textContent).toBe('異');
    expect(root.querySelector('.ids-inline-glyph')).toBeNull();
  });

  it('composes when provider is unavailable and preserves malformed source', async () => {
    const root = document.createElement('p');
    root.textContent = 'A⟦⿰木可⟧ C⟦⿰木⟧';

    await renderIds(root, { provider: { matchIds: async () => ({ found: false, unavailable: true }) } });

    expect(root.textContent).toContain('A木可');
    expect(root.textContent).toContain('C⟦⿰木⟧');
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
  });

  it('does not use the unverified default candidate as a native result', async () => {
    const root = document.createElement('p');
    root.textContent = '⟦⿲彳圭亍⟧';

    await renderIds(root);

    expect(root.textContent).toBe('彳圭亍');
    expect(root.querySelectorAll('.ids-part')).toHaveLength(3);
  });

  it('renders the local path before the public async call yields', async () => {
    const root = document.createElement('p');
    root.textContent = '⟦⿰木可⟧';

    const pending = renderIds(root);

    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
    await pending;
  });

  it('skips contenteditable by default and supports explicit opt-in', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<div contenteditable="true">⟦⿰木可⟧</div>';

    await renderIds(root);
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(0);

    await renderIds(root, { contentEditable: true });
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
  });

  it('observes dynamic additions and stops without reprocessing rendered content', async () => {
    const root = document.createElement('div');
    const providerCalls: string[] = [];
    const handle = observeIds(root, {
      provider: {
        matchIds: async (ids) => {
          providerCalls.push(ids);
          return { found: false };
        },
      },
    });

    await flushObserver();
    const dynamic = document.createElement('span');
    dynamic.textContent = 'X⟦⿰木可⟧Y';
    root.append(dynamic);
    await flushObserver();

    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
    expect(providerCalls).toEqual(['⿰木可']);

    handle.stop();
    const afterStop = document.createElement('span');
    afterStop.textContent = '⟦⿱日月⟧';
    root.append(afterStop);
    await flushObserver();

    expect(afterStop.textContent).toBe('⟦⿱日月⟧');
  });

  it('does not observe contenteditable additions unless enabled', async () => {
    const root = document.createElement('div');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    root.append(editable);
    const handle = observeIds(root);

    editable.append('⟦⿰木可⟧');
    await flushObserver();

    expect(editable.querySelectorAll('.ids-inline-glyph')).toHaveLength(0);
    handle.stop();
  });

  it('can observe contenteditable additions when explicitly enabled', async () => {
    const root = document.createElement('div');
    const editable = document.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    root.append(editable);
    const handle = observeIds(root, { contentEditable: true });

    editable.append('⟦⿰木可⟧');
    await flushObserver();

    expect(editable.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
    handle.stop();
  });

  it('does not replace malformed-only text nodes in an observer loop', async () => {
    const root = document.createElement('div');
    const text = document.createTextNode('⟦⿰木⟧');
    root.append(text);
    const handle = observeIds(root);

    await flushObserver();

    expect(root.firstChild).toBe(text);
    expect(root.textContent).toBe('⟦⿰木⟧');
    handle.stop();
  });

  it('resolves unique IDS in bounded parallel work while preserving document order', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>⟦⿰木可⟧ ⟦⿱日月⟧ ⟦⿲彳圭亍⟧ ⟦⿰木可⟧</p>';
    const calls: string[] = [];
    let active = 0;
    let peak = 0;
    const provider = {
      matchIds: async (ids: string) => {
        calls.push(ids);
        active += 1;
        peak = Math.max(peak, active);
        await new Promise<void>((resolve) => setTimeout(resolve, ids === '⿱日月' ? 5 : 0));
        active -= 1;
        return { found: false } as const;
      },
    };

    await renderIds(root, { provider, maxConcurrency: 2 });

    expect(peak).toBeLessThanOrEqual(2);
    expect(calls).toHaveLength(3);
    expect(new Set(calls)).toEqual(new Set(['⿰木可', '⿱日月', '⿲彳圭亍']));
    expect(root.textContent).toBe('木可 日月 彳圭亍 木可');
  });
});
