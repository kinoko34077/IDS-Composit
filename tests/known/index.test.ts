import { describe, expect, it } from 'vitest';
import { createKnownCharacterIndex, entriesFromKnownRecordsArtifact } from '../../src/known';
import type { KnownCharacterEntry, KnownCharacterRecordsArtifact } from '../../src/known';

const entries: KnownCharacterEntry[] = [
  {
    ids: '⿲彳圭亍',
    character: '街',
    source: 'external fixture',
    sourceVersion: 'test',
    retrievalMethod: 'fixture',
    status: 'verified',
  },
  {
    ids: '⿲彳圭亍',
    character: '候補',
    source: 'candidate fixture',
    sourceVersion: '0.2-test',
    status: 'candidate',
  },
  {
    ids: '⿰木可',
    character: '柯',
    source: 'fixture-a',
    sourceVersion: '0.2-test',
    status: 'verified',
  },
  {
    ids: '⿰木可',
    character: '某',
    source: 'fixture-b',
    sourceVersion: '0.2-test',
    status: 'verified',
  },
];

describe('Known Character Index', () => {
  it('keeps provenance and supports both lookup directions', () => {
    const index = createKnownCharacterIndex(entries);

    expect(index.lookupIds('⿲彳圭亍')).toEqual(entries.slice(0, 2));
    expect(index.lookupCharacter('街')).toEqual([entries[0]]);
    expect(index.lookupCharacter('missing')).toEqual([]);
  });

  it('resolves one verified character and excludes candidates', () => {
    const index = createKnownCharacterIndex(entries);

    expect(index.resolve('⿲彳圭亍')).toEqual({ kind: 'match', character: '街' });
    expect(index.resolve('missing')).toEqual({ kind: 'miss' });
  });

  it('does not silently choose an ambiguous verified character', () => {
    const index = createKnownCharacterIndex(entries);

    expect(index.resolve('⿰木可')).toEqual({ kind: 'ambiguous' });
  });

  it('uses NFC lookup keys without changing stored provenance', () => {
    const sourceIds = '⿰が木';
    const normalizedIds = '⿰が木';
    const entry: KnownCharacterEntry = {
      ids: sourceIds,
      character: '字',
      source: 'external fixture',
      sourceVersion: 'test',
      status: 'verified',
    };
    const index = createKnownCharacterIndex([entry]);

    expect(index.lookupIds(normalizedIds)).toEqual([entry]);
    expect(index.resolve(normalizedIds)).toEqual({ kind: 'match', character: '字' });
    expect(index.lookupIds(normalizedIds)[0]?.ids).toBe(sourceIds);

    const characterEntry: KnownCharacterEntry = {
      ids: '⿰木可',
      character: 'が',
      source: 'external fixture',
      sourceVersion: 'test',
      status: 'candidate',
    };
    const characterIndex = createKnownCharacterIndex([characterEntry]);
    expect(characterIndex.lookupCharacter('が')).toEqual([characterEntry]);
  });

  it('hydrates a compact optional artifact only when explicitly requested', () => {
    const artifact: KnownCharacterRecordsArtifact = {
      schemaVersion: 'ids-composit-known-records/v0.2',
      source: {
        name: 'CHISE IDS database',
        version: 'snapshot-test',
        retrievalMethod: 'fixture',
        fileHash: 'sha256:test',
      },
      records: [
        { ids: '⿴行圭', character: '街', status: 'verified' },
      ],
    };

    const entries = entriesFromKnownRecordsArtifact(artifact);
    expect(entries).toEqual([{
      ids: '⿴行圭',
      character: '街',
      source: 'CHISE IDS database',
      sourceVersion: 'snapshot-test',
      retrievalMethod: 'fixture',
      sourceHash: 'sha256:test',
      status: 'verified',
    }]);
    expect(createKnownCharacterIndex(entries).resolve('⿴行圭')).toEqual({ kind: 'match', character: '街' });
  });
});
