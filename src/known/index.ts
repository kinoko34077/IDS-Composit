import type {
  KnownCharacterEntry,
  KnownCharacterIndex,
  KnownCharacterLookup,
  KnownCharacterRecordsArtifact,
} from './types';
import { normalizeKnownLookupKey } from './normalize-lookup-key.ts';

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

/**
 * Explicitly hydrate an optional compact artifact into runtime entries. The
 * runtime never discovers or imports bulk data by itself.
 */
export function entriesFromKnownRecordsArtifact(
  artifact: KnownCharacterRecordsArtifact,
): KnownCharacterEntry[] {
  return artifact.records.map((record) => ({
    ids: record.ids,
    character: record.character,
    source: artifact.source.name,
    sourceVersion: artifact.source.version,
    retrievalMethod: artifact.source.retrievalMethod,
    ...(artifact.source.fileHash === undefined ? {} : { sourceHash: artifact.source.fileHash }),
    status: record.status,
  }));
}

export { normalizeKnownLookupKey } from './normalize-lookup-key.ts';
export type {
  KnownCharacterArtifactSource,
  KnownCharacterEntry,
  KnownCharacterIndex,
  KnownCharacterLookup,
  KnownCharacterRecordsArtifact,
  KnownCharacterStatus,
} from './types';
