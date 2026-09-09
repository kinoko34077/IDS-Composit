import { describe, expect, it } from 'vitest';
import {
  buildCalibrationSourceRecords,
  buildCalibrationSourceCorpus,
} from '../../tools/calibration/generate-source-corpus';
import type { ChiseIdsParseBundle } from '../../tools/known/import-chise-ids';
import type { ExternalKnownSource } from '../../tools/known/generate-index';

const source = (name: string): ExternalKnownSource => ({
  name,
  version: 'fixture',
  retrievalMethod: 'fixture',
  fileHash: `sha256:${name}`,
});

describe('calibration source corpus integration', () => {
  it('combines source-specific adapters without using Known status as calibration policy', () => {
    const chise: ChiseIdsParseBundle = {
      files: [{ file: 'IDS-UCS-Basic.txt', text: '' }],
      records: [{ ids: '⿴行圭', character: '街', status: 'verified' }],
      apparentRecords: [{ ids: '⿰木可', character: '柯', file: 'IDS-UCS-Basic.txt', line: 2 }],
      issues: [],
      warnings: [],
      fileStats: [],
    };
    const records = buildCalibrationSourceRecords({
      babelStone: {
        source: source('BabelStone IDS'),
        records: [{ ids: '⿲彳圭亍', character: '街', status: 'verified', variantTag: 'J' }],
      },
      chise: { parsed: chise, source: source('CHISE IDS database') },
      yiBaiLv0: {
        source: source('Yi Bai IDS lv0'),
        records: [{ ids: '⿰木可', character: '柯', status: 'candidate', variantTag: 'primary' }],
      },
    });

    expect(records.map((record) => [record.source, record.ids, record.calibrationRole])).toEqual([
      ['BabelStone IDS', '⿲彳圭亍', 'primary-candidate'],
      ['CHISE IDS database', '⿰木可', 'primary-candidate'],
      ['CHISE IDS database', '⿴行圭', 'diagnostic'],
      ['Yi Bai IDS lv0', '⿰木可', 'primary-candidate'],
    ]);
  });

  it('keeps an ambiguous IDS out of primary and alternate training', () => {
    const result = buildCalibrationSourceCorpus([
      {
        ids: '⿰木可', character: '柯', source: 'BabelStone IDS', sourceVersion: 'fixture',
        calibrationRole: 'primary-candidate',
      },
      {
        ids: '⿰木可', character: '枯', source: 'Yi Bai IDS lv0', sourceVersion: 'fixture',
        calibrationRole: 'primary-candidate',
      },
    ]);

    expect(result.corpus.ambiguousIds).toEqual(['⿰木可']);
    expect(result.corpus.primary.train).toEqual([]);
    expect(result.corpus.primary.holdout).toEqual([]);
    expect(result.corpus.alternate.train).toEqual([]);
    expect(result.corpus.alternate.holdout).toEqual([]);
    expect(result.corpus.diagnostics).toHaveLength(2);
  });
});
