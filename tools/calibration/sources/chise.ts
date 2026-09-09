import type { ChiseIdsParseBundle } from '../../known/import-chise-ids.ts';
import type { ExternalKnownSource } from '../../known/generate-index.ts';
import { isCalibrationEligibleIds, withCalibrationProvenance } from './common.ts';
import type { CalibrationSourceRecord } from './types.ts';

/**
 * CHISE functional IDS remains a Resolver/diagnostic record. The optional
 * @apparent view is the only CHISE input eligible for Calibration candidates.
 */
export function toChiseCalibrationRecords(
  parsed: ChiseIdsParseBundle,
  source: ExternalKnownSource,
): CalibrationSourceRecord[] {
  const functional = parsed.records.map((record): CalibrationSourceRecord => withCalibrationProvenance({
    ids: record.ids,
    character: record.character,
    variantRole: 'functional',
    calibrationRole: 'diagnostic',
  }, source));
  const apparent = parsed.apparentRecords.map((record): CalibrationSourceRecord => withCalibrationProvenance({
    ids: record.ids,
    character: record.character,
    variantRole: 'apparent',
    sourceRecordId: `${record.file}:${record.line}`,
    calibrationRole: isCalibrationEligibleIds(record.ids) ? 'primary-candidate' : 'excluded',
  }, source));
  return [...functional, ...apparent].sort((left, right) => {
    const leftKey = `${left.ids}\u0000${left.character}\u0000${left.variantRole ?? ''}`;
    const rightKey = `${right.ids}\u0000${right.character}\u0000${right.variantRole ?? ''}`;
    return leftKey === rightKey ? 0 : leftKey < rightKey ? -1 : 1;
  });
}
