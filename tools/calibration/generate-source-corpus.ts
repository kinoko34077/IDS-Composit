import { parseIds } from '../../src/parser/parse-ids.ts';
import type { IdsNode } from '../../src/core/types.ts';
import {
  isCalibrationEligibleIds,
  isUnicodeScalar,
  normalizeCalibrationText,
} from './sources/common.ts';
import { selectCalibrationRecords } from './select.ts';
import { partitionCalibrationCharacter } from './split.ts';
import type { CalibrationSourceRecord } from './sources/types.ts';

export type CalibrationCorpusSample = CalibrationSourceRecord & {
  operator: string;
  components: string[];
  partition: 'train' | 'holdout';
};

export type CalibrationSourceCorpus = {
  version: 'v0.2-calibration-source';
  region: 'JP';
  primary: { train: CalibrationCorpusSample[]; holdout: CalibrationCorpusSample[] };
  alternate: { train: CalibrationCorpusSample[]; holdout: CalibrationCorpusSample[] };
  diagnostics: CalibrationSourceRecord[];
  excluded: CalibrationSourceRecord[];
  ambiguousIds: string[];
};

export type CalibrationSourceCorpusReport = {
  schemaVersion: 'ids-composit-calibration-source-corpus-report/v0.2';
  stats: {
    inputRecords: number;
    knownEligible: number;
    primary: number;
    alternate: number;
    train: number;
    holdout: number;
    diagnostics: number;
    excluded: number;
    ambiguousIds: number;
  };
  bySource: Readonly<Record<string, number>>;
};

export type CalibrationSourceCorpusResult = {
  corpus: CalibrationSourceCorpus;
  report: CalibrationSourceCorpusReport;
};

function collectComponents(node: IdsNode, components: string[]): void {
  if (node.type === 'char') {
    components.push(node.value);
    return;
  }
  for (const child of node.children) collectComponents(child, components);
}

function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareSamples(left: CalibrationCorpusSample, right: CalibrationCorpusSample): number {
  const leftKey = `${normalizeCalibrationText(left.character)}\u0000${normalizeCalibrationText(left.ids)}\u0000${left.source}`;
  const rightKey = `${normalizeCalibrationText(right.character)}\u0000${normalizeCalibrationText(right.ids)}\u0000${right.source}`;
  return compareText(leftKey, rightKey);
}

function toSample(record: CalibrationSourceRecord): CalibrationCorpusSample | undefined {
  if (!isUnicodeScalar(record.character) || !isCalibrationEligibleIds(record.ids)) return undefined;
  const parsed = parseIds(record.ids);
  if (!parsed.ok || parsed.ast.type !== 'composition') return undefined;
  const components: string[] = [];
  collectComponents(parsed.ast, components);
  if (!components.every(isUnicodeScalar)) return undefined;
  return {
    ...record,
    operator: parsed.ast.operator,
    components,
    partition: partitionCalibrationCharacter(record.character),
  };
}

function splitSamples(samples: readonly CalibrationCorpusSample[]): { train: CalibrationCorpusSample[]; holdout: CalibrationCorpusSample[] } {
  const train = samples.filter((sample) => sample.partition === 'train').sort(compareSamples);
  const holdout = samples.filter((sample) => sample.partition === 'holdout').sort(compareSamples);
  return { train, holdout };
}

export function buildCalibrationSourceCorpus(
  records: readonly CalibrationSourceRecord[],
): CalibrationSourceCorpusResult {
  const selection = selectCalibrationRecords(records);
  const primary: CalibrationCorpusSample[] = [];
  const alternate: CalibrationCorpusSample[] = [];
  const excluded = [...selection.excluded];

  for (const record of selection.training) {
    const sample = toSample(record);
    if (sample === undefined) excluded.push({ ...record, calibrationRole: 'excluded' });
    else primary.push(sample);
  }
  for (const record of selection.alternates) {
    const sample = toSample(record);
    if (sample === undefined) excluded.push({ ...record, calibrationRole: 'excluded' });
    else alternate.push(sample);
  }

  primary.sort(compareSamples);
  alternate.sort(compareSamples);
  const primaryPartitions = splitSamples(primary);
  const alternatePartitions = splitSamples(alternate);
  const bySource: Record<string, number> = {};
  for (const sample of [...primary, ...alternate]) bySource[sample.source] = (bySource[sample.source] ?? 0) + 1;

  const corpus: CalibrationSourceCorpus = {
    version: 'v0.2-calibration-source',
    region: 'JP',
    primary: primaryPartitions,
    alternate: alternatePartitions,
    diagnostics: selection.diagnostics,
    excluded,
    ambiguousIds: selection.ambiguousIds,
  };
  return {
    corpus,
    report: {
      schemaVersion: 'ids-composit-calibration-source-corpus-report/v0.2',
      stats: {
        inputRecords: records.length,
        knownEligible: primary.length + alternate.length,
        primary: primary.length,
        alternate: alternate.length,
        train: primaryPartitions.train.length + alternatePartitions.train.length,
        holdout: primaryPartitions.holdout.length + alternatePartitions.holdout.length,
        diagnostics: selection.diagnostics.length,
        excluded: excluded.length,
        ambiguousIds: selection.ambiguousIds.length,
      },
      bySource,
    },
  };
}
