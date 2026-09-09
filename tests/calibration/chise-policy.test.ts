import { describe, expect, it } from 'vitest';
import {
  createChiseIdsSource,
  parseChiseIdsFile,
  type ChiseIdsParseBundle,
} from '../../tools/known/import-chise-ids';
import { toChiseCalibrationRecords } from '../../tools/calibration/sources/chise';

describe('CHISE calibration policy', () => {
  it('uses parseable apparent IDS as primary and functional IDS as diagnostic', () => {
    const parsed = parseChiseIdsFile(
      'U+6771\t東\t⿴木日\t@apparent=⿰木日\t@apparent=⿰木月\n',
      'IDS-UCS-Basic.txt',
    );
    const bundle: ChiseIdsParseBundle = {
      files: [{ file: 'IDS-UCS-Basic.txt', text: 'fixture' }],
      records: parsed.records,
      apparentRecords: parsed.apparentRecords,
      issues: parsed.issues,
      warnings: parsed.warnings,
      fileStats: [parsed.stats],
    };
    const source = createChiseIdsSource({
      revision: 'fixture-revision',
      version: 'fixture-version',
      files: ['IDS-UCS-Basic.txt'],
      fileHash: 'sha256:chise',
    });

    const result = toChiseCalibrationRecords(bundle, source);

    expect(result.map(({ ids, calibrationRole, variantRole }) => ({ ids, calibrationRole, variantRole }))).toEqual([
      { ids: '⿰木日', calibrationRole: 'primary-candidate', variantRole: 'apparent' },
      { ids: '⿰木月', calibrationRole: 'primary-candidate', variantRole: 'apparent' },
      { ids: '⿴木日', calibrationRole: 'diagnostic', variantRole: 'functional' },
    ]);
  });

  it('does not promote a functional-only row when apparent IDS is absent', () => {
    const parsed = parseChiseIdsFile('U+6771\t東\t⿴木日\n', 'IDS-UCS-Basic.txt');
    const source = createChiseIdsSource({
      revision: 'fixture-revision',
      files: ['IDS-UCS-Basic.txt'],
      fileHash: 'sha256:chise',
    });
    expect(toChiseCalibrationRecords({
      files: [{ file: 'IDS-UCS-Basic.txt', text: 'fixture' }],
      records: parsed.records,
      apparentRecords: parsed.apparentRecords,
      issues: parsed.issues,
      warnings: parsed.warnings,
      fileStats: [parsed.stats],
    }, source)).toEqual([
      expect.objectContaining({ ids: '⿴木日', calibrationRole: 'diagnostic' }),
    ]);
  });
});
