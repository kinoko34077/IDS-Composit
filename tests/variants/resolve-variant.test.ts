import { describe, expect, it } from 'vitest';
import type { IdsNode } from '../../src/core/types';
import { composeLayout } from '../../src/composition';
import { VARIANT_MAP } from '../../src/data/variants';
import { resolveVariant } from '../../src/variants';

describe('resolveVariant', () => {
  it.each([
    ['水', 'left', '氵'],
    ['水', 'bottom', '氺'],
    ['火', 'bottom', '灬'],
    ['人', 'left', '亻'],
    ['心', 'left', '忄'],
    ['手', 'left', '扌'],
    ['犬', 'left', '犭'],
    ['示', 'left', '礻'],
    ['糸', 'left', '糹'],
    ['爪', 'top', '爫'],
  ] as const)('maps %s in %s role to %s', (base, role, expected) => {
    expect(resolveVariant(base, role, VARIANT_MAP)).toBe(expected);
  });

  it('falls back to the base character when the role is not registered', () => {
    expect(resolveVariant('木', 'left', VARIANT_MAP)).toBe('木');
    expect(resolveVariant('水', 'right', VARIANT_MAP)).toBe('水');
  });

  it('accepts an additional mapping without changing resolver logic', () => {
    expect(resolveVariant('山', 'left', { 山: { left: '⛰' } })).toBe('⛰');
  });
});

describe('variant-aware composition', () => {
  it('applies a position variant only to glyph leaves', () => {
    const ast: IdsNode = {
      type: 'composition',
      operator: '⿰',
      children: [
        { type: 'char', value: '水' },
        { type: 'char', value: '青' },
      ],
    };

    const layout = composeLayout(ast);
    expect(layout.type).toBe('composition');
    if (layout.type !== 'composition') throw new Error('Expected a composition layout');
    expect(layout.children).toMatchObject([
      { type: 'glyph', value: '氵', role: 'left' },
      { type: 'glyph', value: '青', role: 'right' },
    ]);
  });
});
