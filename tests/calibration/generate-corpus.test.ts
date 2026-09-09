import { describe, expect, it } from 'vitest';
import { buildCalibrationCorpusArtifact } from '../../tools/calibration/generate-corpus';
import type { KnownCharacterRecordsArtifact } from '../../src/known';

describe('calibration corpus generator', () => {
  it('builds a Unicode-only corpus from verified compact records and keeps source provenance', () => {
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
        { ids: '⿾木可', character: 'x', status: 'verified' },
        { ids: '⿰木可', character: '候補', status: 'candidate' },
      ],
    };

    const result = buildCalibrationCorpusArtifact(artifact);

    expect(result.report.stats).toEqual({
      inputRecords: 3,
      eligibleRecords: 1,
      train: 0,
      holdout: 1,
      excluded: 2,
      byOperator: { '⿴': 1 },
    });
    expect(result.corpus.source).toEqual(artifact.source);
    expect(result.corpus.holdout[0]).toMatchObject({
      ids: '⿴行圭',
      character: '街',
    });
    expect(result.corpus.holdout[0]).not.toHaveProperty('sourceHash');
  });
});
