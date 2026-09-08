import { describe, expect, it } from 'vitest';
import { createMemoryMatchCache } from '../../src/chise/cache';

describe('createMemoryMatchCache', () => {
  it('returns a cached match before TTL expiry', () => {
    const cache = createMemoryMatchCache(1000);
    cache.set('⿰木可', { found: true, text: '某' });

    expect(cache.get('⿰木可')).toEqual({ found: true, text: '某' });
  });

  it('does not cache unavailable results', () => {
    const cache = createMemoryMatchCache(1000);
    cache.set('⿰木可', { found: false, unavailable: true });

    expect(cache.get('⿰木可')).toBeUndefined();
  });

  it('expires entries and limits the number of retained entries', () => {
    let now = 0;
    const cache = createMemoryMatchCache({ ttlMs: 100, maxEntries: 2, now: () => now });
    cache.set('a', { found: true, text: '甲' });
    cache.set('b', { found: true, text: '乙' });
    cache.set('c', { found: true, text: '丙' });

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toEqual({ found: true, text: '乙' });
    expect(cache.get('c')).toEqual({ found: true, text: '丙' });

    now = 100;
    expect(cache.get('b')).toBeUndefined();
    expect(cache.size).toBe(1);
  });

  it('clears retained entries explicitly', () => {
    const cache = createMemoryMatchCache({ ttlMs: 1000, maxEntries: 2 });
    cache.set('a', { found: true, text: '甲' });
    cache.clear();

    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});
