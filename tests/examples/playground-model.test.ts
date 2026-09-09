import { describe, expect, it } from 'vitest';
import { PATTERN_CASES, toDisplaySource } from '../../examples/playground-model';

describe('mobile playground model', () => {
  it('normalizes raw and wrapped IDS input without altering the source body', () => {
    expect(toDisplaySource('  ⿰木可  ')).toBe('⟦⿰木可⟧');
    expect(toDisplaySource('  ⟦⿰水青⟧  ')).toBe('⟦⿰水青⟧');
    expect(toDisplaySource('')).toBe('');
  });

  it('catalogs every supported layout family and visible fallback case', () => {
    const sources = PATTERN_CASES.map((pattern) => pattern.source);

    expect(sources).toEqual(expect.arrayContaining([
      '⿰木可',
      '⿰水青',
      '⿱艹明',
      '⿴囗王',
      '⿰木⿱日月',
      '⿲彳圭亍',
      '⿳士冖豆',
      '⿰鬱青',
      '⿱龜心',
      '⿵門日',
      '⿶一凵',
      '⿷匚口',
      '⿸广木',
      '⿹戸口',
      '⿺廴日',
      '⿻木口',
      '⿼句口',
      '⿽乙丶',
      '⿾木可',
    ]));
    expect(PATTERN_CASES.find((pattern) => pattern.source === '⿲彳圭亍')?.resolution).toContain('Known Index hit');
  });
});
