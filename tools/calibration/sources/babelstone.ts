import type { ExternalKnownRecord, ExternalKnownSource } from '../../known/generate-index.ts';
import { isCalibrationEligibleIds, withCalibrationProvenance } from './common.ts';
import type { CalibrationSourceRecord } from './types.ts';

function createRecord(
  record: ExternalKnownRecord,
  source: ExternalKnownSource,
  calibrationRole: CalibrationSourceRecord['calibrationRole'],
  region?: string,
): CalibrationSourceRecord {
  return withCalibrationProvenance({
    ids: record.ids,
    character: record.character,
    ...(region === undefined ? {} : { region }),
    ...(record.variantTag === undefined ? {} : { variantRole: record.variantTag }),
    calibrationRole,
  }, source);
}

/**
 * BabelStone tags are preserved as source metadata. Only a direct J tag is a
 * JP primary candidate; X is retained as an alternate. Other regional tags,
 * Z, and special/non-structural mappings remain auditable but excluded.
 */
export function toBabelStoneCalibrationRecords(
  records: readonly ExternalKnownRecord[],
  source: ExternalKnownSource,
): CalibrationSourceRecord[] {
  return records.map((record) => {
    const tag = record.variantTag ?? '';
    if (!isCalibrationEligibleIds(record.ids) || tag.includes('Z')) {
      return createRecord(record, source, 'excluded');
    }
    if (tag.includes('J')) return createRecord(record, source, 'primary-candidate', 'JP');
    if (tag.includes('X')) return createRecord(record, source, 'alternate', 'JP');
    return createRecord(record, source, 'excluded');
  });
}
