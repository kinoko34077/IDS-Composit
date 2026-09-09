import { createHash } from 'node:crypto';
import { normalizeCalibrationText } from './sources/common.ts';
import type { CalibrationSourceRecord } from './sources/types.ts';

export type CalibrationPartition = 'train' | 'holdout';

function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function recordKey(record: CalibrationSourceRecord): string {
  return [
    normalizeCalibrationText(record.character),
    normalizeCalibrationText(record.ids),
    record.source,
    record.variantRole ?? '',
    record.sourceRecordId ?? '',
    record.calibrationRole,
  ].join('\u0000');
}

/**
 * Stable character-level split. The first four digest bytes are the
 * unsigned equivalent of the first eight SHA-256 hex digits.
 */
export function partitionCalibrationCharacter(character: string): CalibrationPartition {
  const key = normalizeCalibrationText(character);
  const digest = createHash('sha256').update(key, 'utf8').digest();
  const bucket = digest.readUInt32BE(0) % 100;
  return bucket < 20 ? 'holdout' : 'train';
}

export function splitCalibrationRecords(
  records: readonly CalibrationSourceRecord[],
): { train: CalibrationSourceRecord[]; holdout: CalibrationSourceRecord[] } {
  const train: CalibrationSourceRecord[] = [];
  const holdout: CalibrationSourceRecord[] = [];
  for (const record of records) {
    (partitionCalibrationCharacter(record.character) === 'holdout' ? holdout : train).push(record);
  }
  train.sort((left, right) => compareText(recordKey(left), recordKey(right)));
  holdout.sort((left, right) => compareText(recordKey(left), recordKey(right)));
  return { train, holdout };
}
