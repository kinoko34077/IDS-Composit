/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { composeLayout } from '../../src/composition';
import { parseIds } from '../../src/parser';
import { renderLayout } from '../../src/renderer/render-layout';

const sources = [
  '⿵門日', '⿶一凵', '⿷匚口', '⿸广木', '⿹戸口', '⿺廴日', '⿻木口', '⿼句口', '⿽乙丶',
] as const;

describe('spatial IDC DOM output', () => {
  it.each(sources)('renders %s as a two-child composition', (source) => {
    const parsed = parseIds(source);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const root = renderLayout(composeLayout(parsed.ast), document, source);

    expect(root.dataset.ids).toBe(source);
    expect(root.querySelectorAll('.ids-part')).toHaveLength(2);
  });
});
