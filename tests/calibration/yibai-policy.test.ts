import { describe, expect, it } from 'vitest';
import { toYiBaiLv0CalibrationRecords } from '../../tools/calibration/sources/yibai';
import type { ExternalKnownRecord, ExternalKnownSource } from '../../tools/known/generate-index';

const source: ExternalKnownSource = {
  name: 'Yi Bai IDS lv0',
  version: 'fixture-lv0',
  retrievalMethod: 'fixture',
  fileHash: 'sha256:yibai',
};

describe('Yi Bai lv0 calibration policy', () => {
  it('separates safe primary and alternative records from special syntax', () => {
    const records: ExternalKnownRecord[] = [
      { ids: '⿰木日', character: '東', status: 'candidate', variantTag: 'primary' },
      { ids: '⿰木月', character: '東', status: 'candidate', variantTag: 'alternative' },
      { ids: '⿰{1}日', character: '香', status: 'candidate', variantTag: 'primary;marker' },
    ];
    const result = toYiBaiLv0CalibrationRecords(records, source);

    expect(result.map(({ ids, calibrationRole }) => ({ ids, calibrationRole }))).toEqual([
      { ids: '⿰木日', calibrationRole: 'primary-candidate' },
      { ids: '⿰木月', calibrationRole: 'alternate' },
      { ids: '⿰{1}日', calibrationRole: 'excluded' },
    ]);
  });
});
