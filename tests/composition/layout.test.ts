import { describe, expect, it } from 'vitest';
import type { IdsNode } from '../../src/core/types';
import { composeLayout, getChildRoles } from '../../src/composition';
import { LAYOUT_TEMPLATES } from '../../src/data/layout-templates';

describe('composition roles', () => {
  it.each([
    ['⿰', ['left', 'right']],
    ['⿱', ['top', 'bottom']],
    ['⿲', ['left', 'middle', 'right']],
    ['⿳', ['top', 'middle', 'bottom']],
    ['⿴', ['outer', 'inner']],
  ] as const)('maps %s children to structural roles', (operator, roles) => {
    expect(getChildRoles(operator)).toEqual(roles);
  });
});

describe('composeLayout', () => {
  it('keeps structural roles out of geometry templates', () => {
    expect(LAYOUT_TEMPLATES['⿰']).toEqual([
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ]);
  });

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

  it('places three horizontal children in thirds', () => {
    const layout = composeLayout({
      type: 'composition',
      operator: '⿲',
      children: [
        { type: 'char', value: '彳' },
        { type: 'char', value: '圭' },
        { type: 'char', value: '亍' },
      ],
    });

    expect(layout).toMatchObject({
      children: [
        { value: '彳', role: 'left', box: { x: 0, y: 0, width: 1 / 3, height: 1 } },
        { value: '圭', role: 'middle', box: { x: 1 / 3, y: 0, width: 1 / 3, height: 1 } },
        { value: '亍', role: 'right', box: { x: 2 / 3, y: 0, width: 1 / 3, height: 1 } },
      ],
    });
  });

  it('places three vertical children in thirds', () => {
    const layout = composeLayout({
      type: 'composition',
      operator: '⿳',
      children: [
        { type: 'char', value: '士' },
        { type: 'char', value: '冖' },
        { type: 'char', value: '豆' },
      ],
    });

    expect(layout).toMatchObject({
      children: [
        { value: '士', role: 'top', box: { x: 0, y: 0, width: 1, height: 1 / 3 } },
        { value: '冖', role: 'middle', box: { x: 0, y: 1 / 3, width: 1, height: 1 / 3 } },
        { value: '豆', role: 'bottom', box: { x: 0, y: 2 / 3, width: 1, height: 1 / 3 } },
      ],
    });
  });

  it('rejects an operator without a layout template', () => {
    expect(() =>
      composeLayout({
        type: 'composition',
        operator: '⿾',
        children: [
          { type: 'char', value: '木' },
          { type: 'char', value: '可' },
        ],
      }),
    ).toThrow('Unsupported IDS operator');
  });
});
