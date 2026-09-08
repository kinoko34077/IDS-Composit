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
});
