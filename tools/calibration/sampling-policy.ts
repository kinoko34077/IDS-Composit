import type { KnownCharacterEntry } from '../../src/known/types.ts';
import { normalizeKnownLookupKey } from '../../src/known/normalize-lookup-key.ts';

export const DEFAULT_CALIBRATION_SOURCE_PRIORITY = [
  'CHISE IDS database',
  'BabelStone IDS',
  'Yi Bai IDS lv0',
  'Yi Bai IDS lv1',
  'Yi Bai IDS lv2',
] as const;

export type CalibrationSample = KnownCharacterEntry & {
  sampleRole: 'primary' | 'alternate';
};

export type CalibrationSamplingResult = {
  primary: readonly CalibrationSample[];
  alternate: readonly CalibrationSample[];
};

export type CalibrationSamplingOptions = {
  sourcePriority?: readonly string[];
};

function sourceRank(source: string, priority: readonly string[]): number {
  const index = priority.indexOf(source);
  if (index >= 0) return index;
  const combinedIndex = priority.findIndex((candidate) => source.includes(candidate));
  return combinedIndex < 0 ? priority.length : combinedIndex;
}

function compareCandidates(left: KnownCharacterEntry, right: KnownCharacterEntry, priority: readonly string[]): number {
  const rankDifference = sourceRank(left.source, priority) - sourceRank(right.source, priority);
  if (rankDifference !== 0) return rankDifference;
  const sourceDifference = left.source < right.source ? -1 : left.source > right.source ? 1 : 0;
  if (sourceDifference !== 0) return sourceDifference;
  const idsLeft = normalizeKnownLookupKey(left.ids);
  const idsRight = normalizeKnownLookupKey(right.ids);
  if (idsLeft !== idsRight) return idsLeft < idsRight ? -1 : 1;
  return left.character < right.character ? -1 : left.character > right.character ? 1 : 0;
}

/**
 * Keep one deterministic primary sample per Unicode character. Alternate IDS
 * expressions remain available for a separate validation group instead of
 * multiplying the same completed character in the training distribution.
 */
export function selectCalibrationSamples(
  entries: readonly KnownCharacterEntry[],
  options: CalibrationSamplingOptions = {},
): CalibrationSamplingResult {
  const priority = options.sourcePriority ?? DEFAULT_CALIBRATION_SOURCE_PRIORITY;
  const candidates = entries.filter((entry) => entry.status === 'verified');
  const byCharacter = new Map<string, KnownCharacterEntry[]>();
  for (const entry of candidates) {
    const key = normalizeKnownLookupKey(entry.character);
    const characterEntries = byCharacter.get(key) ?? [];
    characterEntries.push(entry);
    byCharacter.set(key, characterEntries);
  }

  const primary: CalibrationSample[] = [];
  const alternate: CalibrationSample[] = [];
  for (const entriesForCharacter of byCharacter.values()) {
    const uniquePairs = new Map<string, KnownCharacterEntry>();
    for (const entry of entriesForCharacter) {
      const key = `${normalizeKnownLookupKey(entry.ids)}\u0000${normalizeKnownLookupKey(entry.character)}`;
      if (!uniquePairs.has(key)) uniquePairs.set(key, entry);
    }
    const sorted = [...uniquePairs.values()].sort((left, right) => compareCandidates(left, right, priority));
    const [first, ...rest] = sorted;
    if (first !== undefined) primary.push({ ...first, sampleRole: 'primary' });
    alternate.push(...rest.map((entry): CalibrationSample => ({ ...entry, sampleRole: 'alternate' })));
  }

  const compareSamples = (left: CalibrationSample, right: CalibrationSample): number => {
    const characterLeft = normalizeKnownLookupKey(left.character);
    const characterRight = normalizeKnownLookupKey(right.character);
    if (characterLeft !== characterRight) return characterLeft < characterRight ? -1 : 1;
    return compareCandidates(left, right, priority);
  };
  primary.sort(compareSamples);
  alternate.sort(compareSamples);
  return { primary, alternate };
}
