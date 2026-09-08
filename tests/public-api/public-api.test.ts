/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { observeIds, renderIds } from '../../src/public-api';

async function flushObserver(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('renderIds', () => {
  it('renders a native provider result without exposing parser details', async () => {
    const root = document.createElement('p');
    root.textContent = 'A⟦⿰木可⟧B';

    await renderIds(root, { provider: { matchIds: async () => ({ found: true, text: '字' }) } });

    expect(root.textContent).toBe('A字B');
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

  it('uses local composition when no provider is configured', async () => {
    const root = document.createElement('p');
    root.textContent = '⟦⿲彳圭亍⟧';

    await renderIds(root);

    expect(root.textContent).toBe('彳圭亍');
    expect(root.querySelectorAll('.ids-part')).toHaveLength(3);
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
});
