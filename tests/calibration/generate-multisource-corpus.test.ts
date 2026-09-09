import { describe, expect, it } from 'vitest';
import { buildMultiSourceCalibrationCorpusArtifact } from '../../tools/calibration/generate-multisource-corpus';
import type { KnownCharacterMergedRecordsArtifact } from '../../src/known';

describe('multi-source calibration corpus generator', () => {
  it('keeps one primary sample per character and separates alternate IDS', () => {
    const artifact: KnownCharacterMergedRecordsArtifact = {
      schemaVersion: 'ids-composit-known-records-merged/v0.2',
      sources: [
        { name: 'CHISE IDS database', version: 'fixture', retrievalMethod: 'fixture' },
        { name: 'BabelStone IDS', version: 'fixture', retrievalMethod: 'fixture' },
      ],
      records: [
        { ids: '⿴行圭', character: '街', status: 'verified', sourceIndexes: [0] },
        { ids: '⿲彳圭亍', character: '街', status: 'verified', sourceIndexes: [1] },
        { ids: '⿰木可', character: '柯', status: 'verified', sourceIndexes: [0] },
      ],
    };

    const result = buildMultiSourceCalibrationCorpusArtifact(artifact);

    expect(result.report.stats).toMatchObject({
      inputRecords: 3,
      eligibleRecords: 3,
      primaryCharacters: 2,
      primary: 2,
      alternate: 1,
    });
    expect(result.corpus.primary.train.map((entry) => entry.character)).toEqual(['街']);
    expect(result.corpus.primary.holdout.map((entry) => entry.character)).toEqual(['柯']);
    expect(result.corpus.alternate.holdout.map((entry) => entry.ids)).toEqual(['⿲彳圭亍']);
    expect(result.corpus.alternate.holdout[0]?.sampleRole).toBe('alternate');
    expect(result.corpus.primary.train[0]?.sourceIndexes).toEqual([0]);
    expect(result.corpus.alternate.holdout[0]?.sourceIndexes).toEqual([1]);
  });
});
