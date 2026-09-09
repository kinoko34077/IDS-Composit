import { describe, expect, it } from 'vitest';
import { partitionCalibrationCharacter, splitCalibrationRecords } from '../../tools/calibration/split';
import type { CalibrationSourceRecord } from '../../tools/calibration/sources/types';

function record(character: string, ids: string, source = 'fixture'): CalibrationSourceRecord {
  return {
    ids,
    character,
    source,
    calibrationRole: 'primary-candidate',
  };
}

describe('Calibration character-hash split', () => {
  it('uses the specified SHA-256 first-32-bit modulo rule', () => {
    expect(partitionCalibrationCharacter('東')).toBe('train');
    expect(partitionCalibrationCharacter('𠀀')).toBe('holdout');
  });

  it('normalizes NFC before hashing', () => {
    expect(partitionCalibrationCharacter('é')).toBe(partitionCalibrationCharacter('e\u0301'));
  });

  it('keeps every record for a character in one partition regardless of input order', () => {
    const first = splitCalibrationRecords([
      record('𠀀', '⿰木日', 'Yi Bai IDS lv0'),
      record('東', '⿰木月', 'CHISE IDS database'),
      record('東', '⿰木日', 'BabelStone IDS'),
    ]);
    const second = splitCalibrationRecords([
      record('東', '⿰木日', 'BabelStone IDS'),
      record('𠀀', '⿰木日', 'Yi Bai IDS lv0'),
      record('東', '⿰木月', 'CHISE IDS database'),
    ]);

    expect(first).toEqual(second);
    expect(first.holdout.map(({ character }) => character)).toEqual(['𠀀']);
    expect(first.train.map(({ character }) => character)).toEqual(['東', '東']);
  });
});
