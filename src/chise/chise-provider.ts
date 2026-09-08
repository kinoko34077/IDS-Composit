import { createMemoryMatchCache } from './cache';
import { normalizeIdsMatchResponse } from './normalize-response';
import { normalizeIdsForChise } from './query-normalizer';
import type { CharacterKnowledgeProvider, ChiseProviderOptions, FetchLike, IdsMatchResult, MatchCache } from './types';

export const DEFAULT_CHISE_IDS_MATCH_ENDPOINT = 'https://api.chise.org/v0/character/ids-match';
const DEFAULT_TIMEOUT_MS = 3000;

function unavailable(error: unknown): IdsMatchResult {
  return { found: false, unavailable: true, error };
}

function defaultFetch(): FetchLike | undefined {
  return typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined;
}

export function createChiseProvider(options: ChiseProviderOptions = {}): CharacterKnowledgeProvider {
  const endpoint = options.endpoint ?? DEFAULT_CHISE_IDS_MATCH_ENDPOINT;
  const fetcher = options.fetch ?? defaultFetch();
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const cache: MatchCache = options.cache ?? createMemoryMatchCache();
  const inFlight = new Map<string, Promise<IdsMatchResult>>();

  const requestMatch = async (key: string): Promise<IdsMatchResult> => {
    if (fetcher === undefined) return unavailable(new Error('Fetch is unavailable'));

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    try {
      const url = new URL(endpoint);
      url.searchParams.set('ids', key);
      const timeout = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          controller.abort();
          reject(new Error('CHISE ids-match request timed out'));
        }, timeoutMs);
      });
      const response = await Promise.race([fetcher(url, { signal: controller.signal }), timeout]);
      if (!response.ok) {
        return unavailable(new Error(`CHISE ids-match returned HTTP ${response.status}`));
      }

      const result = normalizeIdsMatchResponse(await response.json());
      cache.set(key, result);
      return result;
    } catch (error) {
      return unavailable(error);
    } finally {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    }
  };

  return {
    async matchIds(ids: string): Promise<IdsMatchResult> {
      const key = normalizeIdsForChise(ids);
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
      const current = inFlight.get(key);
      if (current !== undefined) return current;

      const request = requestMatch(key);
      inFlight.set(key, request);
      try {
        return await request;
      } finally {
        if (inFlight.get(key) === request) inFlight.delete(key);
      }
    },
  };
}
