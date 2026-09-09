import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseIds } from '../../src/parser/parse-ids.ts';
import type { IdsNode } from '../../src/core/types.ts';
import type {
  ExternalKnownRecord,
  ExternalKnownSource,
  GeneratedKnownRecordsArtifact,
} from '../known/generate-index.ts';
import {
  CHISE_IDS_FILES,
  DEFAULT_CHISE_IDS_REVISION,
  computeSourceHash,
  createChiseIdsSource,
  downloadChiseIdsFiles,
  parseChiseIdsFiles,
  type ChiseIdsParseBundle,
} from '../known/import-chise-ids.ts';
import {
  isCalibrationEligibleIds,
  isUnicodeScalar,
  normalizeCalibrationText,
} from './sources/common.ts';
import { toBabelStoneCalibrationRecords } from './sources/babelstone.ts';
import { toChiseCalibrationRecords } from './sources/chise.ts';
import { toYiBaiLv0CalibrationRecords } from './sources/yibai.ts';
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
    primaryBeforeCap: number;
    primary: number;
    alternate: number;
    primaryTrain: number;
    primaryHoldout: number;
    alternateTrain: number;
    alternateHoldout: number;
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

type PrimarySampleKey = Pick<CalibrationCorpusSample, 'operator' | 'character' | 'ids'>;

export type CalibrationSourceArtifactInput = {
  source: ExternalKnownSource;
  records: readonly ExternalKnownRecord[];
};

export type CalibrationSourceInputs = {
  babelStone?: CalibrationSourceArtifactInput;
  yiBaiLv0?: CalibrationSourceArtifactInput;
  chise?: { parsed: ChiseIdsParseBundle; source: ExternalKnownSource };
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

export function stableCalibrationSampleKey(sample: PrimarySampleKey): string {
  const key = `${normalizeCalibrationText(sample.character)}\u0000${normalizeCalibrationText(sample.ids)}`;
  return createHash('sha256').update(key, 'utf8').digest('hex');
}

/** Convert every external input through its source-specific Calibration adapter. */
export function buildCalibrationSourceRecords(inputs: CalibrationSourceInputs): CalibrationSourceRecord[] {
  const records: CalibrationSourceRecord[] = [];
  if (inputs.babelStone !== undefined) {
    records.push(...toBabelStoneCalibrationRecords(inputs.babelStone.records, inputs.babelStone.source));
  }
  if (inputs.chise !== undefined) {
    records.push(...toChiseCalibrationRecords(inputs.chise.parsed, inputs.chise.source));
  }
  if (inputs.yiBaiLv0 !== undefined) {
    records.push(...toYiBaiLv0CalibrationRecords(inputs.yiBaiLv0.records, inputs.yiBaiLv0.source));
  }
  return records;
}

/** Cap only primary training samples; holdout is intentionally uncapped. */
export function limitPrimaryTrainingSamples<T extends PrimarySampleKey>(
  samples: readonly T[],
  maxPerOperator = 2_000,
): T[] {
  if (!Number.isInteger(maxPerOperator) || maxPerOperator < 1) {
    throw new RangeError('Calibration primary sample limit must be a positive integer');
  }
  const byOperator = new Map<string, T[]>();
  for (const sample of samples) {
    const group = byOperator.get(sample.operator) ?? [];
    group.push(sample);
    byOperator.set(sample.operator, group);
  }
  return [...byOperator.values()]
    .flatMap((group) => group
      .sort((left, right) => compareText(stableCalibrationSampleKey(left), stableCalibrationSampleKey(right)))
      .slice(0, maxPerOperator))
    .sort((left, right) => compareText(
      `${left.operator}\u0000${stableCalibrationSampleKey(left)}`,
      `${right.operator}\u0000${stableCalibrationSampleKey(right)}`,
    ));
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
  const primaryUncappedPartitions = splitSamples(primary);
  const primaryPartitions = {
    train: limitPrimaryTrainingSamples(primaryUncappedPartitions.train),
    holdout: primaryUncappedPartitions.holdout,
  };
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
        primaryBeforeCap: primary.length,
        primary: primaryPartitions.train.length + primaryPartitions.holdout.length,
        alternate: alternate.length,
        primaryTrain: primaryPartitions.train.length,
        primaryHoldout: primaryPartitions.holdout.length,
        alternateTrain: alternatePartitions.train.length,
        alternateHoldout: alternatePartitions.holdout.length,
        diagnostics: selection.diagnostics.length,
        excluded: excluded.length,
        ambiguousIds: selection.ambiguousIds.length,
      },
      bySource,
    },
  };
}

function isKnownRecordsArtifact(value: unknown): value is GeneratedKnownRecordsArtifact {
  if (typeof value !== 'object' || value === null) return false;
  const artifact = value as Partial<GeneratedKnownRecordsArtifact>;
  return artifact.schemaVersion === 'ids-composit-known-records/v0.2'
    && Array.isArray(artifact.records)
    && typeof artifact.source === 'object'
    && artifact.source !== null;
}

async function readKnownRecordsArtifact(path: string): Promise<CalibrationSourceArtifactInput> {
  const value: unknown = JSON.parse(await readFile(resolve(path), 'utf8'));
  if (!isKnownRecordsArtifact(value)) throw new Error(`Unsupported Known records artifact: ${path}`);
  return { source: value.source, records: value.records };
}

async function readChiseDirectory(directory: string): Promise<{ parsed: ChiseIdsParseBundle; source: ExternalKnownSource }> {
  const files = await Promise.all(CHISE_IDS_FILES.map(async (file) => ({
    file,
    text: await readFile(join(resolve(directory), file), 'utf8'),
  })));
  const parsed = parseChiseIdsFiles(files);
  return {
    parsed,
    source: createChiseIdsSource({
      revision: 'local-directory-input',
      version: 'local-directory-input',
      files: files.map(({ file }) => file),
      fileHash: computeSourceHash(files),
    }),
  };
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function loadChiseInput(args: readonly string[]): Promise<{ parsed: ChiseIdsParseBundle; source: ExternalKnownSource }> {
  const directory = argumentValue(args, '--chise-dir');
  if (directory !== undefined) return readChiseDirectory(directory);
  const revision = argumentValue(args, '--chise-revision') ?? DEFAULT_CHISE_IDS_REVISION;
  const files = await downloadChiseIdsFiles({ revision, concurrency: 4 });
  return {
    parsed: parseChiseIdsFiles(files),
    source: createChiseIdsSource({
      revision,
      files: files.map(({ file }) => file),
      fileHash: computeSourceHash(files),
    }),
  };
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run calibration:build:source -- [--babelstone FILE] [--yibai-lv0 FILE] [--chise-dir DIR | --chise-revision SHA] [--output FILE] [--report FILE]');
    return;
  }
  const babelStonePath = argumentValue(args, '--babelstone') ?? 'data/known/generated/babelstone-ids-v0.2.json';
  const yiBaiLv0Path = argumentValue(args, '--yibai-lv0') ?? 'data/known/generated/yibai-lv0-v0.2.json';
  const output = argumentValue(args, '--output') ?? '.artifacts/calibration/calibration-source-corpus-v0.2.json';
  const reportPath = argumentValue(args, '--report') ?? '.artifacts/calibration/calibration-source-corpus-report-v0.2.json';
  const [babelStone, yiBaiLv0, chise] = await Promise.all([
    readKnownRecordsArtifact(babelStonePath),
    readKnownRecordsArtifact(yiBaiLv0Path),
    loadChiseInput(args),
  ]);
  if (chise.parsed.issues.length > 0) {
    throw new Error(`CHISE Calibration source contains ${chise.parsed.issues.length} malformed row(s); refusing to build corpus`);
  }
  const records = buildCalibrationSourceRecords({ babelStone, yiBaiLv0, chise });
  const result = buildCalibrationSourceCorpus(records);
  await mkdir(resolve(output, '..'), { recursive: true });
  await mkdir(resolve(reportPath, '..'), { recursive: true });
  await writeFile(resolve(output), `${JSON.stringify(result.corpus)}\n`, 'utf8');
  await writeFile(resolve(reportPath), `${JSON.stringify({
    ...result.report,
    sources: [babelStone.source, yiBaiLv0.source, chise.source],
  }, null, 2)}\n`, 'utf8');
  console.log(`Built ${result.report.stats.knownEligible} eligible Calibration records into ${output}`);
  console.log(`Primary train/holdout: ${result.report.stats.primaryTrain}/${result.report.stats.primaryHoldout}`);
  console.log(`Calibration report: ${reportPath}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
