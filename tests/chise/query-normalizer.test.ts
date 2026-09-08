import { describe, expect, it } from 'vitest';
import { normalizeIdsForChise } from '../../src/chise/query-normalizer';

describe('normalizeIdsForChise', () => {
  it('normalizes position variants only for the CHISE query', () => {
    expect(normalizeIdsForChise('⿰水青')).toBe('⿰氵青');
  });

  it('preserves nested structure while applying leaf roles', () => {
    expect(normalizeIdsForChise('⿳水火心')).toBe('⿳水火心');
    expect(normalizeIdsForChise('⿱⿰水青火')).toBe('⿱⿰氵青灬');
  });

  it('keeps malformed query source normalized without inventing a replacement', () => {
    expect(normalizeIdsForChise('⿰水')).toBe('⿰水');
  });
});
