/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { observeIds, renderIds } from '../../src/public-api';

async function flushObserver(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('v0.1 compatibility gate', () => {
  it('keeps the public local render API and nested DOM shape', async () => {
    const root = document.createElement('p');
    root.textContent = 'A⟦⿰木⿱日月⟧B';

    await renderIds(root);

    expect(root.textContent).toBe('A木日月B');
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
    expect(root.querySelectorAll('.ids-part')).toHaveLength(3);
  });

  it('preserves invalid and unsupported source text', async () => {
    const root = document.createElement('p');
    root.textContent = '⟦⿰木⟧ / ⟦⿾木可⟧';

    await renderIds(root);

    expect(root.textContent).toBe('⟦⿰木⟧ / ⟦⿾木可⟧');
  });

  it('keeps contenteditable default-off and supports opt-in', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<div contenteditable="true">⟦⿰木可⟧</div>';

    await renderIds(root);
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(0);

    await renderIds(root, { contentEditable: true });
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
  });

  it('contains provider failure and retains copy/accessibility metadata', async () => {
    const root = document.createElement('p');
    root.textContent = '⟦⿰木可⟧';

    await renderIds(root, { provider: { matchIds: async () => { throw new Error('offline'); } } });

    const glyph = root.querySelector<HTMLElement>('.ids-inline-glyph');
    expect(glyph?.getAttribute('role')).toBe('img');
    expect(glyph?.getAttribute('aria-label')).toBe('⿰木可');
    expect(glyph?.dataset.ids).toBe('⿰木可');
  });

  it('keeps observer stop and source preservation behavior', async () => {
    const root = document.createElement('div');
    const handle = observeIds(root);

    await flushObserver();
    const beforeStop = document.createElement('span');
    beforeStop.textContent = '⟦⿰木可⟧';
    root.append(beforeStop);
    await flushObserver();
    expect(beforeStop.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);

    handle.stop();
    const afterStop = document.createElement('span');
    afterStop.textContent = '⟦⿱日月⟧';
    root.append(afterStop);
    await flushObserver();
    expect(afterStop.textContent).toBe('⟦⿱日月⟧');
  });
});
