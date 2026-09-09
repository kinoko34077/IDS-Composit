import type { KnownCharacterEntry, KnownCharacterIndex, KnownCharacterLookup } from './types';

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
    const idsEntries = byIds.get(entry.ids) ?? [];
    idsEntries.push(entry);
    byIds.set(entry.ids, idsEntries);
    const characterEntries = byCharacter.get(entry.character) ?? [];
    characterEntries.push(entry);
    byCharacter.set(entry.character, characterEntries);
  }

  const resolve = (ids: string): KnownCharacterLookup => {
    const characters = verifiedCharacters(entriesFor(byIds, ids));
    if (characters.length === 1) {
      const character = characters[0];
      if (character !== undefined) return { kind: 'match', character };
    }
    if (characters.length > 1) return { kind: 'ambiguous' };
    return { kind: 'miss' };
  };

  return {
    lookupIds(ids) {
      return entriesFor(byIds, ids);
    },
    lookupCharacter(character) {
      return entriesFor(byCharacter, character);
    },
    resolve,
  };
}

export type { KnownCharacterEntry, KnownCharacterIndex, KnownCharacterLookup, KnownCharacterStatus } from './types';
