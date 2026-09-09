import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  entriesFromKnownRecordsArtifact,
} from '../../src/known/index.ts';
import type {
  KnownCharacterRecordsArtifact,
  KnownCharacterArtifactSource,
} from '../../src/known/types.ts';
import { buildCalibrationCorpus } from './corpus.ts';
import type { CalibrationCorpus, CalibrationCorpusEntry } from './corpus.ts';

type CompactCalibrationCorpusEntry = Omit<CalibrationCorpusEntry, 'source' | 'sourceVersion' | 'retrievalMethod' | 'sourceHash'>;

export type CalibrationCorpusArtifact = {
  version: CalibrationCorpus['version'];
  source: KnownCharacterArtifactSource;
  train: CompactCalibrationCorpusEntry[];
  holdout: CompactCalibrationCorpusEntry[];
};

export type CalibrationCorpusReport = {
  schemaVersion: 'ids-composit-calibration-corpus-report/v0.2';
  source: KnownCharacterArtifactSource;
  stats: {
    inputRecords: number;
    eligibleRecords: number;
    train: number;
    holdout: number;
    excluded: number;
    byOperator: Readonly<Record<string, number>>;
  };
};

function isUnicodeScalar(value: string): boolean {
  const codePoints = Array.from(value);
  if (codePoints.length !== 1) return false;
  const codePoint = codePoints[0]?.codePointAt(0);
  return codePoint !== undefined
    && codePoint <= 0x10ffff
    && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
}

function compactEntries(entries: readonly CalibrationCorpusEntry[]): CompactCalibrationCorpusEntry[] {
  return entries.map(({ ids, character, operator, components }) => ({
    ids,
    character,
    operator,
    components,
  }));
}

export function buildCalibrationCorpusArtifact(
  artifact: KnownCharacterRecordsArtifact,
): { corpus: CalibrationCorpusArtifact; report: CalibrationCorpusReport } {
  const entries = entriesFromKnownRecordsArtifact(artifact);
  const corpus = buildCalibrationCorpus(entries, {
    targetAvailable: isUnicodeScalar,
    componentAvailable: isUnicodeScalar,
  });
  const allEntries = [...corpus.train, ...corpus.holdout];
  const byOperator: Record<string, number> = {};
  for (const entry of allEntries) byOperator[entry.operator] = (byOperator[entry.operator] ?? 0) + 1;

  return {
    corpus: {
      version: corpus.version,
      source: artifact.source,
      train: compactEntries(corpus.train),
      holdout: compactEntries(corpus.holdout),
    },
    report: {
      schemaVersion: 'ids-composit-calibration-corpus-report/v0.2',
      source: artifact.source,
      stats: {
        inputRecords: artifact.records.length,
        eligibleRecords: allEntries.length,
        train: corpus.train.length,
        holdout: corpus.holdout.length,
        excluded: artifact.records.length - allEntries.length,
        byOperator,
      },
    },
  };
}

function assertKnownRecordsArtifact(value: unknown): KnownCharacterRecordsArtifact {
  if (typeof value !== 'object' || value === null) throw new Error('Known records artifact must be an object');
  const artifact = value as Partial<KnownCharacterRecordsArtifact>;
  if (artifact.schemaVersion !== 'ids-composit-known-records/v0.2') {
    throw new Error('Unsupported Known records artifact schema');
  }
  if (!Array.isArray(artifact.records)) throw new Error('Known records artifact records must be an array');
  if (typeof artifact.source !== 'object' || artifact.source === null) throw new Error('Known records artifact source is required');
  return artifact as KnownCharacterRecordsArtifact;
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run calibration:build:corpus -- [--input FILE] [--output FILE] [--report FILE]');
    return;
  }

  const argumentValue = (name: string): string | undefined => {
    const index = args.indexOf(name);
    return index < 0 ? undefined : args[index + 1];
  };
  const input = argumentValue('--input') ?? 'data/known/generated/chise-ids-v0.2.json';
  const output = argumentValue('--output') ?? 'data/calibration/corpus-v0.2.json';
  const reportPath = argumentValue('--report') ?? 'data/calibration/corpus-report-v0.2.json';
  const artifact = assertKnownRecordsArtifact(JSON.parse(await readFile(resolve(input), 'utf8')) as unknown);
  const result = buildCalibrationCorpusArtifact(artifact);
  await mkdir(resolve(output, '..'), { recursive: true });
  await mkdir(resolve(reportPath, '..'), { recursive: true });
  await writeFile(resolve(output), `${JSON.stringify(result.corpus)}\n`, 'utf8');
  await writeFile(resolve(reportPath), `${JSON.stringify(result.report, null, 2)}\n`, 'utf8');
  console.log(`Built ${result.report.stats.eligibleRecords} calibration corpus records into ${output}`);
  console.log(`Calibration report: ${reportPath}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
