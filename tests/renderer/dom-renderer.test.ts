/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { renderIdsInElement, renderLayout } from '../../src/renderer/dom-renderer';
import { composeLayout } from '../../src/composition';
import { parseIds } from '../../src/parser';

describe('renderLayout', () => {
  it('renders a composition as a one-em inline box with source metadata', () => {
    const parsed = parseIds('⿰木可');
    if (!parsed.ok) throw new Error(parsed.error.message);

    const rendered = renderLayout(composeLayout(parsed.ast), document, '⿰木可');
    expect(rendered.tagName).toBe('SPAN');
    expect(rendered.className).toBe('ids-inline-glyph');
    expect(rendered.dataset.ids).toBe('⿰木可');
    expect(rendered.style.display).toBe('inline-block');
    expect(rendered.style.width).toBe('1em');
    expect(rendered.style.height).toBe('1em');
    expect(rendered.querySelectorAll('.ids-part')).toHaveLength(2);
    expect(rendered.querySelector('.ids-part .ids-glyph-content')?.textContent).toBe('木');
    expect((rendered.querySelector('.ids-part .ids-glyph-content') as HTMLElement | null)?.style.transform).toBe('scale(0.5, 1)');
  });

  it('preserves nested composition as nested DOM', () => {
    const parsed = parseIds('⿰木⿱日月');
    if (!parsed.ok) throw new Error(parsed.error.message);

    const rendered = renderLayout(composeLayout(parsed.ast), document, '⿰木⿱日月');
    expect(rendered.querySelectorAll('.ids-composition')).toHaveLength(2);
    expect(rendered.querySelector('.ids-composition .ids-part')?.textContent).toBe('木');
    expect(rendered.querySelectorAll('.ids-composition .ids-part')).toHaveLength(3);
  });

  it('renders trinary composition as three glyph parts', () => {
    const parsed = parseIds('⿲彳圭亍');
    if (!parsed.ok) throw new Error(parsed.error.message);

    const rendered = renderLayout(composeLayout(parsed.ast), document, '⿲彳圭亍');

    expect(rendered.querySelectorAll('.ids-part')).toHaveLength(3);
    expect(rendered.textContent).toBe('彳圭亍');
  });
});

describe('renderIdsInElement', () => {
  it('replaces multiple embedded IDS expressions while preserving surrounding text', () => {
    const root = document.createElement('p');
    root.textContent = 'A⟦⿰木可⟧B⟦⿱日月⟧C';

    renderIdsInElement(root);

    expect(root.childNodes[0]?.textContent).toBe('A');
    expect(root.childNodes[2]?.textContent).toBe('B');
    expect(root.childNodes[4]?.textContent).toBe('C');
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(2);
    expect(root.querySelector('[data-ids="⿰木可"]')).toBeTruthy();
  });

  it('does not scan script, style, or textarea contents', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>A⟦⿰木可⟧B</p><script>⟦⿰木可⟧</script><style>⟦⿰木可⟧</style><textarea>⟦⿰木可⟧</textarea>';

    renderIdsInElement(root);

    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
    expect(root.querySelector('script')?.textContent).toBe('⟦⿰木可⟧');
    expect(root.querySelector('style')?.textContent).toBe('⟦⿰木可⟧');
    expect(root.querySelector('textarea')?.value).toBe('⟦⿰木可⟧');
  });

  it('keeps invalid IDS source visible without losing surrounding text', () => {
    const root = document.createElement('p');
    root.textContent = 'A⟦⿰木⟧B';

    renderIdsInElement(root);

    expect(root.textContent).toBe('A⟦⿰木⟧B');
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(0);
  });

  it('keeps the raw source when one IDS renderer fails', () => {
    const root = document.createElement('p');
    root.textContent = 'A⟦⿰木可⟧B';
    const createElement = document.createElement.bind(document);
    let spanCount = 0;
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'span' && ++spanCount === 2) {
        throw new Error('simulated renderer failure');
      }
      return createElement(tagName);
    });

    try {
      renderIdsInElement(root);
    } finally {
      createElementSpy.mockRestore();
    }

    expect(root.textContent).toBe('A⟦⿰木可⟧B');
    expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(0);
  });
});
