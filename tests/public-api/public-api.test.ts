/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderIds } from '../../src/public-api';

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
});
