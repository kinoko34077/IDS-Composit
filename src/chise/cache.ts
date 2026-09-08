import type { IdsMatchResult, MatchCache } from './types';

type CacheEntry = {
  result: IdsMatchResult;
  expiresAt: number;
};

export type MemoryMatchCacheOptions = {
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
};

export type MemoryMatchCache = MatchCache & {
  clear: () => void;
  readonly size: number;
};

export function createMemoryMatchCache(ttlMs?: number, now?: () => number, maxEntries?: number): MemoryMatchCache;
export function createMemoryMatchCache(options?: MemoryMatchCacheOptions): MemoryMatchCache;
export function createMemoryMatchCache(
  ttlMsOrOptions: number | MemoryMatchCacheOptions = 300_000,
  legacyNow: () => number = Date.now,
  legacyMaxEntries = 256,
): MemoryMatchCache {
  const entries = new Map<string, CacheEntry>();
  const options = typeof ttlMsOrOptions === 'number' ? undefined : ttlMsOrOptions;
  const ttl = Math.max(0, options?.ttlMs ?? (typeof ttlMsOrOptions === 'number' ? ttlMsOrOptions : 300_000));
  const now = options?.now ?? legacyNow;
  const maxEntries = Math.max(1, Math.floor(options?.maxEntries ?? legacyMaxEntries));

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
      entries.delete(key);
      while (entries.size >= maxEntries) {
        const oldestKey = entries.keys().next().value as string | undefined;
        if (oldestKey === undefined) break;
        entries.delete(oldestKey);
      }
      entries.set(key, { result, expiresAt: now() + ttl });
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
  };
}
