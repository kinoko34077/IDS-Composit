import { describe, expect, it } from 'vitest';
import type { IdsNode } from '../../src/core/types';
import { composeLayout, getChildRoles } from '../../src/composition';

describe('composition roles', () => {
  it.each([
    ['⿰', ['left', 'right']],
    ['⿱', ['top', 'bottom']],
    ['⿴', ['outer', 'inner']],
  ] as const)('maps %s children to structural roles', (operator, roles) => {
    expect(getChildRoles(operator)).toEqual(roles);
  });
});

describe('composeLayout', () => {
  it('builds the fixed left-right layout in relative coordinates', () => {
    const ast: IdsNode = {
      type: 'composition',
      operator: '⿰',
      children: [
        { type: 'char', value: '木' },
        { type: 'char', value: '可' },
      ],
    };

    expect(composeLayout(ast)).toEqual({
      type: 'composition',
      operator: '⿰',
      box: { x: 0, y: 0, width: 1, height: 1 },
      children: [
        { type: 'glyph', value: '木', role: 'left', box: { x: 0, y: 0, width: 0.5, height: 1 } },
        { type: 'glyph', value: '可', role: 'right', box: { x: 0.5, y: 0, width: 0.5, height: 1 } },
      ],
    });
  });

  it('multiplies nested child boxes in the parent coordinate system', () => {
    const ast: IdsNode = {
      type: 'composition',
      operator: '⿰',
      children: [
        { type: 'char', value: '木' },
        {
          type: 'composition',
          operator: '⿱',
          children: [
            { type: 'char', value: '日' },
            { type: 'char', value: '月' },
          ],
        },
      ],
    };

    expect(composeLayout(ast)).toMatchObject({
      children: [
        { value: '木', role: 'left', box: { x: 0, y: 0, width: 0.5, height: 1 } },
        {
          type: 'composition',
          operator: '⿱',
          box: { x: 0.5, y: 0, width: 0.5, height: 1 },
          children: [
            { value: '日', role: 'top', box: { x: 0.5, y: 0, width: 0.5, height: 0.5 } },
            { value: '月', role: 'bottom', box: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 } },
          ],
        },
      ],
    });
  });

  it('rejects an operator without a layout template', () => {
    expect(() =>
      composeLayout({
        type: 'composition',
        operator: '⿻',
        children: [
          { type: 'char', value: '木' },
          { type: 'char', value: '可' },
        ],
      }),
    ).toThrow('Unsupported IDS operator');
  });
});
