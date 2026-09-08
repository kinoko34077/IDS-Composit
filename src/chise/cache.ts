import type { IdsMatchResult, MatchCache } from './types';

type CacheEntry = {
  result: IdsMatchResult;
  expiresAt: number;
};

export function createMemoryMatchCache(ttlMs = 300_000, now: () => number = Date.now): MatchCache {
  const entries = new Map<string, CacheEntry>();
  const ttl = Math.max(0, ttlMs);

  return {
    get(key) {
      const entry = entries.get(key);
      if (entry === undefined) return undefined;
      if (entry.expiresAt <= now()) {
        entries.delete(key);
        return undefined;
      }
      return entry.result;
    },
    set(key, result) {
      if (result.found === false && 'unavailable' in result) return;
      if (ttl === 0) return;
      entries.set(key, { result, expiresAt: now() + ttl });
    },
  };
}
