import type { IdsMatchResult } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCharacterObject(value: Record<string, unknown>): boolean {
  const characterType = value['@type'];
  const characterId = value['@id'] ?? value.id;
  return characterType === 'genre:character' && typeof characterId === 'string' && characterId.length > 0;
}

export function normalizeIdsMatchResponse(payload: unknown): IdsMatchResult {
  if (payload === null) {
    return { found: false };
  }

  if (typeof payload === 'string' && payload.length > 0) {
    return { found: true, text: payload, raw: payload };
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return { found: false };
    }
    const nativeText = payload.find((item): item is string => typeof item === 'string' && item.length > 0);
    if (nativeText !== undefined) {
      return { found: true, text: nativeText, raw: payload };
    }
    if (payload.every((item) => isRecord(item) && isCharacterObject(item))) {
      return { found: false };
    }
  }

  if (isRecord(payload) && isCharacterObject(payload)) {
    return { found: false };
  }

  throw new Error('Unsupported CHISE ids-match response');
}
