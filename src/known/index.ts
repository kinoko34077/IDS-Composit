import type { KnownCharacterEntry, KnownCharacterIndex, KnownCharacterLookup } from './types';
import { normalizeKnownLookupKey } from './normalize-lookup-key';

function entriesFor(map: ReadonlyMap<string, readonly KnownCharacterEntry[]>, key: string): readonly KnownCharacterEntry[] {
  return map.get(key) ?? [];
}

function verifiedCharacters(entries: readonly KnownCharacterEntry[]): string[] {
  return Array.from(new Set(entries
    .filter((entry) => entry.status === 'verified')
    .map((entry) => entry.character)));
}

export function createKnownCharacterIndex(entries: readonly KnownCharacterEntry[]): KnownCharacterIndex {
  const byIds = new Map<string, KnownCharacterEntry[]>();
  const byCharacter = new Map<string, KnownCharacterEntry[]>();

  for (const entry of entries) {
    if (entry.ids.length === 0 || entry.character.length === 0 || entry.source.length === 0) continue;
    const idsKey = normalizeKnownLookupKey(entry.ids);
    const characterKey = normalizeKnownLookupKey(entry.character);
    const idsEntries = byIds.get(idsKey) ?? [];
    idsEntries.push(entry);
    byIds.set(idsKey, idsEntries);
    const characterEntries = byCharacter.get(characterKey) ?? [];
    characterEntries.push(entry);
    byCharacter.set(characterKey, characterEntries);
  }

  const resolve = (ids: string): KnownCharacterLookup => {
    const characters = verifiedCharacters(entriesFor(byIds, normalizeKnownLookupKey(ids)));
    if (characters.length === 1) {
      const character = characters[0];
      if (character !== undefined) return { kind: 'match', character };
    }
    if (characters.length > 1) return { kind: 'ambiguous' };
    return { kind: 'miss' };
  };

  return {
    lookupIds(ids) {
      return entriesFor(byIds, normalizeKnownLookupKey(ids));
    },
    lookupCharacter(character) {
      return entriesFor(byCharacter, normalizeKnownLookupKey(character));
    },
    resolve,
  };
}

export { normalizeKnownLookupKey } from './normalize-lookup-key';
export type { KnownCharacterEntry, KnownCharacterIndex, KnownCharacterLookup, KnownCharacterStatus } from './types';
