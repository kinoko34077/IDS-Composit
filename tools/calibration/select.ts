import { normalizeCalibrationText } from './sources/common.ts';
import type { CalibrationSourceRecord, CalibrationSourceRole } from './sources/types.ts';

export type CalibrationSelection = {
  /** One stable primary sample at most for each non-ambiguous character. */
  training: CalibrationSourceRecord[];
  /** Eligible alternatives retained for separate validation/sampling. */
  alternates: CalibrationSourceRecord[];
  /** Functional/source diagnostics and ambiguous candidate mappings. */
  diagnostics: CalibrationSourceRecord[];
  /** Source records which are not safe for the v0.2 JP training pool. */
  excluded: CalibrationSourceRecord[];
  ambiguousIds: string[];
};

function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function normalizedIds(record: CalibrationSourceRecord): string {
  return normalizeCalibrationText(record.ids);
}

function normalizedCharacter(record: CalibrationSourceRecord): string {
  return normalizeCalibrationText(record.character);
}

function recordKey(record: CalibrationSourceRecord): string {
  return [
    normalizedIds(record),
    normalizedCharacter(record),
    record.source,
    record.variantRole ?? '',
    record.sourceRecordId ?? '',
    record.calibrationRole,
  ].join('\u0000');
}

function compareRecords(left: CalibrationSourceRecord, right: CalibrationSourceRecord): number {
  return compareText(recordKey(left), recordKey(right));
}

function withRole(record: CalibrationSourceRecord, calibrationRole: CalibrationSourceRole): CalibrationSourceRecord {
  return record.calibrationRole === calibrationRole ? record : { ...record, calibrationRole };
}

function sourcePriority(source: string): number {
  if (source === 'BabelStone IDS') return 0;
  if (source.startsWith('CHISE IDS')) return 1;
  if (source === 'Yi Bai IDS lv0') return 2;
  return 3;
}

function comparePrimaryCandidates(left: CalibrationSourceRecord, right: CalibrationSourceRecord): number {
  const rankDifference = sourcePriority(left.source) - sourcePriority(right.source);
  if (rankDifference !== 0) return rankDifference;
  const idsDifference = compareText(normalizedIds(left), normalizedIds(right));
  return idsDifference !== 0 ? idsDifference : compareRecords(left, right);
}

function deduplicate(records: readonly CalibrationSourceRecord[]): CalibrationSourceRecord[] {
  const seen = new Set<string>();
  const result: CalibrationSourceRecord[] = [];
  for (const record of records) {
    const key = recordKey(record);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

export function selectCalibrationRecords(
  records: readonly CalibrationSourceRecord[],
): CalibrationSelection {
  const uniqueRecords = deduplicate(records);
  const charactersByIds = new Map<string, Set<string>>();
  for (const record of uniqueRecords) {
    if (record.calibrationRole === 'excluded') continue;
    const ids = normalizedIds(record);
    const characters = charactersByIds.get(ids) ?? new Set<string>();
    characters.add(normalizedCharacter(record));
    charactersByIds.set(ids, characters);
  }

  const ambiguousIds = [...charactersByIds.entries()]
    .filter(([, characters]) => characters.size > 1)
    .map(([ids]) => ids)
    .sort(compareText);
  const ambiguous = new Set(ambiguousIds);
  const training: CalibrationSourceRecord[] = [];
  const alternates: CalibrationSourceRecord[] = [];
  const diagnostics: CalibrationSourceRecord[] = [];
  const excluded: CalibrationSourceRecord[] = [];
  const primaryByCharacter = new Map<string, CalibrationSourceRecord[]>();

  for (const record of uniqueRecords) {
    if (record.calibrationRole === 'excluded') {
      excluded.push(record);
      continue;
    }
    if (ambiguous.has(normalizedIds(record)) || record.calibrationRole === 'diagnostic') {
      diagnostics.push(withRole(record, 'diagnostic'));
      continue;
    }
    if (record.calibrationRole === 'primary-candidate') {
      const character = normalizedCharacter(record);
      const candidates = primaryByCharacter.get(character) ?? [];
      candidates.push(record);
      primaryByCharacter.set(character, candidates);
      continue;
    }
    alternates.push(record);
  }

  for (const candidates of primaryByCharacter.values()) {
    candidates.sort(comparePrimaryCandidates);
    const [primary, ...remaining] = candidates;
    if (primary !== undefined) training.push(primary);
    alternates.push(...remaining.map((record) => withRole(record, 'alternate')));
  }

  training.sort(compareRecords);
  alternates.sort(compareRecords);
  diagnostics.sort(compareRecords);
  excluded.sort(compareRecords);
  return { training, alternates, diagnostics, excluded, ambiguousIds };
}
