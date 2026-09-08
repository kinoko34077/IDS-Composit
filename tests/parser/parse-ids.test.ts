import { describe, expect, it } from 'vitest';
import { parseIds } from '../../src/parser/parse-ids';

describe('parseIds', () => {
  it('parses a binary IDS into a two-child AST', () => {
    expect(parseIds('⿰木可')).toEqual({
      ok: true,
      ast: {
        type: 'composition',
        operator: '⿰',
        children: [
          { type: 'char', value: '木' },
          { type: 'char', value: '可' },
        ],
      },
    });
  });

  it('preserves nested composition structure', () => {
    expect(parseIds('⿰木⿱日月')).toEqual({
      ok: true,
      ast: {
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
      },
    });
  });

  it('parses a three-child left-middle-right IDS', () => {
    expect(parseIds('⿲彳圭亍')).toEqual({
      ok: true,
      ast: {
        type: 'composition',
        operator: '⿲',
        children: [
          { type: 'char', value: '彳' },
          { type: 'char', value: '圭' },
          { type: 'char', value: '亍' },
        ],
      },
    });
  });

  it.each([
    ['empty', '', 'empty'],
    ['missing child', '⿰木', 'missing-child'],
    ['trailing input', '木可', 'trailing-input'],
    ['unknown operator', '⿻木可', 'unknown-operator'],
  ])('reports %s input without producing an AST', (_label, source, kind) => {
    const result = parseIds(source);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe(kind);
      expect(result.error.index).toBeGreaterThanOrEqual(0);
    }
  });
});
