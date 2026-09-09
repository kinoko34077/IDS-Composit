import { describe, expect, it } from 'vitest';
import { toBabelStoneCalibrationRecords } from '../../tools/calibration/sources/babelstone';
import type { ExternalKnownRecord, ExternalKnownSource } from '../../tools/known/generate-index';

const source: ExternalKnownSource = {
  name: 'BabelStone IDS',
  version: 'fixture-2025',
  retrievalMethod: 'fixture',
  fileHash: 'sha256:babelstone',
};

function record(ids: string, character: string, variantTag: string): ExternalKnownRecord {
  return { ids, character, status: 'verified', variantTag };
}

describe('BabelStone calibration policy', () => {
  it('classifies direct JP, alternate, Z, non-JP, and special mappings', () => {
    const result = toBabelStoneCalibrationRecords([
      record('⿰木日', '東', 'J'),
      record('⿰木月', '東', 'X'),
      record('⿰木山', '東', 'Z'),
      record('⿰木川', '東', 'G'),
      record('⿰{1}日', '香', 'J'),
    ], source);

    expect(result.map(({ ids, calibrationRole, region }) => ({ ids, calibrationRole, region }))).toEqual([
      { ids: '⿰木日', calibrationRole: 'primary-candidate', region: 'JP' },
      { ids: '⿰木月', calibrationRole: 'alternate', region: 'JP' },
      { ids: '⿰木山', calibrationRole: 'excluded', region: undefined },
      { ids: '⿰木川', calibrationRole: 'excluded', region: undefined },
      { ids: '⿰{1}日', calibrationRole: 'excluded', region: undefined },
    ]);
    expect(result[0]).toMatchObject({ source: source.name, sourceVersion: source.version, sourceHash: source.fileHash });
  });
});
