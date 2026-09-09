import { describe, expect, it } from 'vitest';
import { entriesFromKnownRecordsArtifact, createKnownCharacterIndex } from '../../src/known';
import type { GeneratedKnownRecordsArtifact } from '../../tools/known/generate-index';
import { mergeKnownRecordsArtifacts } from '../../tools/known/merge-known-sources';

function source(name: string) {
  return {
    name,
    version: 'fixture',
    retrievalMethod: 'fixture',
    license: 'MIT',
  };
}

function artifact(name: string, records: GeneratedKnownRecordsArtifact['records']): GeneratedKnownRecordsArtifact {
  return { schemaVersion: 'ids-composit-known-records/v0.2', source: source(name), records };
}

describe('multi-source Known merge', () => {
  it('deduplicates corroborated pairs while retaining alternate IDS for 街', () => {
    const merged = mergeKnownRecordsArtifacts([
      artifact('CHISE IDS database', [{ ids: '⿴行圭', character: '街', status: 'verified' }]),
      artifact('BabelStone IDS', [{ ids: '⿲彳圭亍', character: '街', status: 'verified' }]),
      artifact('Yi Bai IDS lv2', [{ ids: '⿴行圭', character: '街', status: 'verified' }]),
    ]);

    expect(merged.artifact.records).toEqual([
      { ids: '⿲彳圭亍', character: '街', status: 'verified', sourceIndexes: [1] },
      { ids: '⿴行圭', character: '街', status: 'verified', sourceIndexes: [0, 2] },
    ]);
    expect(merged.report.stats).toMatchObject({
      totalRecords: 3,
      uniqueIds: 2,
      uniqueCharacters: 1,
      uniquePairs: 2,
      singleSourcePairs: 1,
      multiSourceCorroboratedPairs: 1,
      sameCharacterMultipleIds: 1,
      sameIdsMultipleCharacters: 0,
      verified: 2,
      candidate: 0,
    });

    const index = createKnownCharacterIndex(entriesFromKnownRecordsArtifact(merged.artifact));
    expect(index.resolve('⿴行圭')).toEqual({ kind: 'match', character: '街' });
    expect(index.resolve('⿲彳圭亍')).toEqual({ kind: 'match', character: '街' });
  });

  it('reports ambiguity instead of majority-voting same IDS candidates', () => {
    const merged = mergeKnownRecordsArtifacts([
      artifact('A', [{ ids: '⿰木可', character: '柯', status: 'verified' }]),
      artifact('B', [{ ids: '⿰木可', character: '柯', status: 'verified' }]),
      artifact('C', [{ ids: '⿰木可', character: '何', status: 'verified' }]),
    ]);

    expect(merged.report.stats.sameIdsMultipleCharacters).toBe(1);
    expect(createKnownCharacterIndex(entriesFromKnownRecordsArtifact(merged.artifact)).resolve('⿰木可'))
      .toEqual({ kind: 'ambiguous' });
    expect(merged.report.sourceCombinations).toMatchObject({ 'A+B': 1, C: 1 });
    expect(merged.report.sourceCombinationCounts).toMatchObject({ 'A+B': 1, 'C-only': 1 });
  });

  it('uses stable base-source labels for the required cross-source audit buckets', () => {
    const merged = mergeKnownRecordsArtifacts([
      artifact('CHISE IDS database', [{ ids: '⿰木可', character: '柯', status: 'verified' }]),
      artifact('BabelStone IDS', [{ ids: '⿰日月', character: '明', status: 'verified' }]),
      artifact('Yi Bai IDS lv2', [{ ids: '⿱日月', character: '昌', status: 'verified' }]),
    ]);

    expect(merged.report.sourceCombinationCounts).toEqual({
      'BabelStone-only': 1,
      'CHISE-only': 1,
      'YiBai-only': 1,
    });
  });
});
