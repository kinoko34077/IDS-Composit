import type { ExternalKnownRecord, ExternalKnownSource } from '../../known/generate-index.ts';
import { isCalibrationEligibleIds, withCalibrationProvenance } from './common.ts';
import type { CalibrationSourceRecord } from './types.ts';

export function toYiBaiLv0CalibrationRecords(
  records: readonly ExternalKnownRecord[],
  source: ExternalKnownSource,
): CalibrationSourceRecord[] {
  return records.map((record) => {
    const isAlternative = (record.variantTag ?? '').split(';')[0] === 'alternative';
    const role = !isCalibrationEligibleIds(record.ids)
      ? 'excluded'
      : isAlternative ? 'alternate' : 'primary-candidate';
    return withCalibrationProvenance({
      ids: record.ids,
      character: record.character,
      ...(record.variantTag === undefined ? {} : { variantRole: record.variantTag }),
      calibrationRole: role,
    }, source);
  });
}
