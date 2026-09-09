import { describe, expect, it } from 'vitest';
import type { CalibrationSourceRecord, CalibrationSourceRole } from '../../tools/calibration/sources/types';

describe('Calibration source contracts', () => {
  it('exposes a calibration-only role set without reusing Known status', () => {
    const roles: CalibrationSourceRole[] = [
      'primary-candidate',
      'alternate',
      'diagnostic',
      'excluded',
    ];
    const record: CalibrationSourceRecord = {
      ids: '⿰木日',
      character: '東',
      source: 'fixture',
      sourceVersion: 'test-1',
      sourceHash: 'sha256:fixture',
      region: 'JP',
      variantRole: 'primary',
      sourceRecordId: 'fixture:1',
      calibrationRole: roles[0]!,
    };

    expect(record.calibrationRole).toBe('primary-candidate');
    expect(roles).toHaveLength(4);
  });
});
