import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { IDC_DEFINITIONS } from '../../src/data/idc.ts';
import type { IdsNode } from '../../src/core/types.ts';
import { entriesFromKnownRecordsArtifact } from '../../src/known/index.ts';
import type { KnownCharacterEntry, KnownCharacterMergedRecordsArtifact } from '../../src/known/types.ts';
import { parseIds } from '../../src/parser/parse-ids.ts';
import { buildCalibrationCorpus } from './corpus.ts';
import { selectCalibrationSamples } from './sampling-policy.ts';
import type { CalibrationSample } from './sampling-policy.ts';

export type MultiSourceCalibrationEntry = {
  ids: string;
  character: string;
  operator: string;
  components: string[];
  source: string;
  sourceVersion?: string;
  retrievalMethod?: string;
  sourceHash?: string;
  sampleRole: 'primary' | 'alternate';
};

export type MultiSourceCalibrationCorpusArtifact = {
  version: 'v0.2-multisource';
  sources: KnownCharacterMergedRecordsArtifact['sources'];
  primary: {
    train: MultiSourceCalibrationEntry[];
    holdout: MultiSourceCalibrationEntry[];
  };
  alternate: {
    train: MultiSourceCalibrationEntry[];
    holdout: MultiSourceCalibrationEntry[];
  };
};

export type MultiSourceCalibrationCorpusReport = {
  schemaVersion: 'ids-composit-multisource-calibration-corpus-report/v0.2';
  stats: {
    inputRecords: number;
    eligibleRecords: number;
    primaryCharacters: number;
    primary: number;
    alternate: number;
    train: number;
    holdout: number;
    excluded: number;
  };
};

function isUnicodeScalar(value: string): boolean {
  const codePoints = Array.from(value);
  if (codePoints.length !== 1) return false;
  const codePoint = codePoints[0]?.codePointAt(0);
  return codePoint !== undefined && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
}

function collectComponents(node: IdsNode, components: string[]): void {
  if (node.type === 'char') {
    components.push(node.value);
    return;
  }
  for (const child of node.children) collectComponents(child, components);
}

function isCalibrationEligible(entry: KnownCharacterEntry): boolean {
  if (entry.status !== 'verified' || !isUnicodeScalar(entry.character)) return false;
  const parsed = parseIds(entry.ids);
  if (!parsed.ok || parsed.ast.type !== 'composition' || IDC_DEFINITIONS[parsed.ast.operator] === undefined) return false;
  const components: string[] = [];
  collectComponents(parsed.ast, components);
  return components.every(isUnicodeScalar);
}

function withSampleRole(entry: CalibrationSample, sampleRole: 'primary' | 'alternate'): KnownCharacterEntry {
  const { sampleRole: _ignored, ...knownEntry } = entry;
  return knownEntry;
}

function toEntries(
  entries: readonly CalibrationSample[],
  sampleRole: 'primary' | 'alternate',
): { train: MultiSourceCalibrationEntry[]; holdout: MultiSourceCalibrationEntry[] } {
  const corpus = buildCalibrationCorpus(entries.map((entry) => withSampleRole(entry, sampleRole)));
  const convert = (entry: typeof corpus.train[number]): MultiSourceCalibrationEntry => ({
    ...entry,
    sampleRole,
  });
  return {
    train: corpus.train.map(convert),
    holdout: corpus.holdout.map(convert),
  };
}

export function buildMultiSourceCalibrationCorpusArtifact(
  artifact: KnownCharacterMergedRecordsArtifact,
): { corpus: MultiSourceCalibrationCorpusArtifact; report: MultiSourceCalibrationCorpusReport } {
  const entries = entriesFromKnownRecordsArtifact(artifact);
  const eligible = entries.filter(isCalibrationEligible);
  const samples = selectCalibrationSamples(eligible);
  const primary = toEntries(samples.primary, 'primary');
  const alternate = toEntries(samples.alternate, 'alternate');
  const selected = primary.train.length + primary.holdout.length + alternate.train.length + alternate.holdout.length;
  return {
    corpus: {
      version: 'v0.2-multisource',
      sources: artifact.sources,
      primary,
      alternate,
    },
    report: {
      schemaVersion: 'ids-composit-multisource-calibration-corpus-report/v0.2',
      stats: {
        inputRecords: artifact.records.length,
        eligibleRecords: selected,
        primaryCharacters: samples.primary.length,
        primary: primary.train.length + primary.holdout.length,
        alternate: alternate.train.length + alternate.holdout.length,
        train: primary.train.length + alternate.train.length,
        holdout: primary.holdout.length + alternate.holdout.length,
        excluded: artifact.records.length - selected,
      },
    },
  };
}

function assertMergedArtifact(value: unknown): KnownCharacterMergedRecordsArtifact {
  if (typeof value !== 'object' || value === null) throw new Error('Merged Known artifact must be an object');
  const artifact = value as Partial<KnownCharacterMergedRecordsArtifact>;
  if (artifact.schemaVersion !== 'ids-composit-known-records-merged/v0.2') throw new Error('Unsupported merged Known artifact schema');
  if (!Array.isArray(artifact.sources) || !Array.isArray(artifact.records)) throw new Error('Merged Known artifact sources and records are required');
  return artifact as KnownCharacterMergedRecordsArtifact;
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run calibration:build:multisource -- [--input FILE] [--output FILE] [--report FILE]');
    return;
  }
  const input = argumentValue(args, '--input') ?? 'data/known/generated/known-index-v0.2.json';
  const output = argumentValue(args, '--output') ?? 'data/calibration/corpus-multisource-v0.2.json';
  const reportPath = argumentValue(args, '--report') ?? 'data/calibration/corpus-multisource-report-v0.2.json';
  const artifact = assertMergedArtifact(JSON.parse(await readFile(resolve(input), 'utf8')) as unknown);
  const result = buildMultiSourceCalibrationCorpusArtifact(artifact);
  await mkdir(resolve(output, '..'), { recursive: true });
  await mkdir(resolve(reportPath, '..'), { recursive: true });
  await writeFile(resolve(output), `${JSON.stringify(result.corpus)}\n`, 'utf8');
  await writeFile(resolve(reportPath), `${JSON.stringify(result.report, null, 2)}\n`, 'utf8');
  console.log(`Built ${result.report.stats.eligibleRecords} multi-source calibration records into ${output}`);
  console.log(`Calibration report: ${reportPath}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
