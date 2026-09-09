import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { KnownCharacterMergedRecordsArtifact } from '../../src/known/types.ts';
import { normalizeKnownLookupKey } from '../../src/known/normalize-lookup-key.ts';
import { analyzeExternalIds } from './external-ids.ts';
import type { ExternalKnownRecord, ExternalKnownSource, GeneratedKnownRecordsArtifact } from './generate-index.ts';

export type KnownMergeReport = {
  schemaVersion: 'ids-composit-known-merge-report/v0.2';
  stats: {
    totalRecords: number;
    uniqueIds: number;
    uniqueCharacters: number;
    uniquePairs: number;
    singleSourcePairs: number;
    multiSourceCorroboratedPairs: number;
    sameCharacterMultipleIds: number;
    sameIdsMultipleCharacters: number;
    candidate: number;
    verified: number;
    invalidIds: number;
    unsupportedStructuralIdc: number;
  };
  sourceCounts: Readonly<Record<string, {
    records: number;
    uniquePairs: number;
    candidate: number;
    verified: number;
  }>>;
  sourceCombinations: Readonly<Record<string, number>>;
  sourceCombinationCounts: Readonly<Record<string, number>>;
  examples: {
    street: {
      bySource: Readonly<Record<string, readonly string[]>>;
      unified: readonly string[];
    };
  };
  conflicts: {
    sameCharacterMultipleIds: readonly { character: string; ids: readonly string[] }[];
    sameIdsMultipleCharacters: readonly { ids: string; characters: readonly string[] }[];
  };
};

export type MergeKnownSourcesResult = {
  artifact: KnownCharacterMergedRecordsArtifact;
  report: KnownMergeReport;
};

type PairObservation = {
  ids: string;
  character: string;
  statusBySource: Map<number, 'verified' | 'candidate'>;
};

function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function pairKey(ids: string, character: string): string {
  return `${normalizeKnownLookupKey(ids)}\u0000${normalizeKnownLookupKey(character)}`;
}

function sourceLabel(source: ExternalKnownSource): string {
  if (/CHISE/u.test(source.name)) return 'CHISE';
  if (/BabelStone/u.test(source.name)) return 'BabelStone';
  if (/Yi Bai/u.test(source.name)) return 'YiBai';
  return source.name;
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedRecordSources(sources: readonly number[]): number[] {
  return [...new Set(sources)].sort((left, right) => left - right);
}

function recordsForSource(artifact: GeneratedKnownRecordsArtifact): ExternalKnownRecord[] {
  return artifact.records.map((record) => ({
    ids: record.ids,
    character: record.character,
    status: record.status,
  }));
}

export function mergeKnownRecordsArtifacts(
  artifacts: readonly GeneratedKnownRecordsArtifact[],
): MergeKnownSourcesResult {
  const sources = artifacts.map((artifact) => artifact.source);
  const observations = new Map<string, PairObservation>();
  const sourceCounts = new Map<string, { records: number; pairs: Set<string>; candidate: number; verified: number }>();
  let totalRecords = 0;
  let invalidIds = 0;
  let unsupportedStructuralIdc = 0;

  artifacts.forEach((artifact, sourceIndex) => {
    const sourceStats = sourceCounts.get(artifact.source.name) ?? { records: 0, pairs: new Set<string>(), candidate: 0, verified: 0 };
    for (const record of recordsForSource(artifact)) {
      totalRecords += 1;
      sourceStats.records += 1;
      if (record.status === 'verified') sourceStats.verified += 1;
      else sourceStats.candidate += 1;
      const key = pairKey(record.ids, record.character);
      sourceStats.pairs.add(key);
      const previous = observations.get(key);
      const observation = previous ?? { ids: record.ids, character: record.character, statusBySource: new Map() };
      observation.statusBySource.set(
        sourceIndex,
        observation.statusBySource.get(sourceIndex) === 'verified' || record.status === 'verified' ? 'verified' : 'candidate',
      );
      observations.set(key, observation);

      const analysis = analyzeExternalIds(record.ids);
      if (!analysis.wellFormed && !analysis.hasSpecialComponent) invalidIds += 1;
      if (analysis.unsupportedStructuralIdc.length > 0) unsupportedStructuralIdc += 1;
    }
    sourceCounts.set(artifact.source.name, sourceStats);
  });

  const mergedRecords = [...observations.values()]
    .map((observation) => ({
      ids: observation.ids,
      character: observation.character,
      status: [...observation.statusBySource.values()].includes('verified') ? 'verified' as const : 'candidate' as const,
      sourceIndexes: sortedRecordSources([...observation.statusBySource.keys()]),
    }))
    .sort((left, right) => compareText(
      `${normalizeKnownLookupKey(left.ids)}\u0000${normalizeKnownLookupKey(left.character)}\u0000${left.status}`,
      `${normalizeKnownLookupKey(right.ids)}\u0000${normalizeKnownLookupKey(right.character)}\u0000${right.status}`,
    ));

  const idsToCharacters = new Map<string, Set<string>>();
  const charactersToIds = new Map<string, Set<string>>();
  for (const record of mergedRecords) {
    const ids = normalizeKnownLookupKey(record.ids);
    const character = normalizeKnownLookupKey(record.character);
    const characters = idsToCharacters.get(ids) ?? new Set<string>();
    characters.add(character);
    idsToCharacters.set(ids, characters);
    const idsForCharacter = charactersToIds.get(character) ?? new Set<string>();
    idsForCharacter.add(ids);
    charactersToIds.set(character, idsForCharacter);
  }

  const sourceCombinations = new Map<string, number>();
  const sourceCombinationCounts = new Map<string, number>();
  for (const record of mergedRecords) {
    const names = record.sourceIndexes.map((index) => sources[index]!.name);
    const key = names.join('+');
    increment(sourceCombinations, key);
    const labels = record.sourceIndexes.map((index) => sourceLabel(sources[index]!));
    const labelKey = labels.length === 1
      ? `${labels[0]}-only`
      : labels.length === sources.length
        ? 'all-sources'
        : labels.join('+');
    increment(sourceCombinationCounts, labelKey);
  }

  const streetBySource: Record<string, string[]> = {};
  artifacts.forEach((artifact) => {
    streetBySource[artifact.source.name] = [...new Set(recordsForSource(artifact)
      .filter((record) => normalizeKnownLookupKey(record.character) === '街')
      .map((record) => record.ids))].sort();
  });
  const street = [...new Set(mergedRecords
    .filter((record) => normalizeKnownLookupKey(record.character) === '街')
    .map((record) => record.ids))].sort();

  const sameCharacterMultipleIds = [...charactersToIds.entries()]
    .filter(([, ids]) => ids.size > 1)
    .map(([character, ids]) => ({ character, ids: [...ids].sort() }))
    .sort((left, right) => compareText(left.character, right.character));
  const sameIdsMultipleCharacters = [...idsToCharacters.entries()]
    .filter(([, characters]) => characters.size > 1)
    .map(([ids, characters]) => ({ ids, characters: [...characters].sort() }))
    .sort((left, right) => compareText(left.ids, right.ids));

  const report: KnownMergeReport = {
    schemaVersion: 'ids-composit-known-merge-report/v0.2',
    stats: {
      totalRecords,
      uniqueIds: idsToCharacters.size,
      uniqueCharacters: charactersToIds.size,
      uniquePairs: mergedRecords.length,
      singleSourcePairs: mergedRecords.filter((record) => record.sourceIndexes.length === 1).length,
      multiSourceCorroboratedPairs: mergedRecords.filter((record) => record.sourceIndexes.length > 1).length,
      sameCharacterMultipleIds: sameCharacterMultipleIds.length,
      sameIdsMultipleCharacters: sameIdsMultipleCharacters.length,
      candidate: mergedRecords.filter((record) => record.status === 'candidate').length,
      verified: mergedRecords.filter((record) => record.status === 'verified').length,
      invalidIds,
      unsupportedStructuralIdc,
    },
    sourceCounts: Object.fromEntries([...sourceCounts.entries()].sort(([left], [right]) => compareText(left, right)).map(([name, value]) => [name, {
      records: value.records,
      uniquePairs: value.pairs.size,
      candidate: value.candidate,
      verified: value.verified,
    }])),
    sourceCombinations: Object.fromEntries([...sourceCombinations.entries()].sort(([left], [right]) => compareText(left, right))),
    sourceCombinationCounts: Object.fromEntries([...sourceCombinationCounts.entries()].sort(([left], [right]) => compareText(left, right))),
    examples: { street: { bySource: streetBySource, unified: street } },
    conflicts: { sameCharacterMultipleIds, sameIdsMultipleCharacters },
  };

  return {
    artifact: {
      schemaVersion: 'ids-composit-known-records-merged/v0.2',
      sources,
      records: mergedRecords,
    },
    report,
  };
}

function assertArtifact(value: unknown, path: string): GeneratedKnownRecordsArtifact {
  if (typeof value !== 'object' || value === null) throw new Error(`Invalid Known source artifact: ${path}`);
  const artifact = value as Partial<GeneratedKnownRecordsArtifact>;
  if (artifact.schemaVersion !== 'ids-composit-known-records/v0.2' || artifact.source === undefined || !Array.isArray(artifact.records)) {
    throw new Error(`Invalid Known source artifact: ${path}`);
  }
  return artifact as GeneratedKnownRecordsArtifact;
}

function argumentValues(args: readonly string[], name: string): string[] {
  const values: string[] = [];
  args.forEach((arg, index) => {
    if (arg === name && args[index + 1] !== undefined) values.push(args[index + 1]!);
  });
  return values;
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run known:merge -- [--input FILE]... [--output FILE] [--report FILE]');
    return;
  }
  const inputs = argumentValues(args, '--input');
  const defaultInputs = [
    'data/known/generated/chise-ids-v0.2.json',
    'data/known/generated/babelstone-ids-v0.2.json',
    'data/known/generated/yibai-lv2-v0.2.json',
  ];
  const output = args.includes('--output') ? args[args.indexOf('--output') + 1] : 'data/known/generated/known-index-v0.2.json';
  const reportPath = args.includes('--report') ? args[args.indexOf('--report') + 1] : 'data/known/reports/known-index-v0.2.json';
  const paths = inputs.length > 0 ? inputs : defaultInputs;
  const artifacts = await Promise.all(paths.map(async (path) => assertArtifact(JSON.parse(await readFile(resolve(path), 'utf8')) as unknown, path)));
  const merged = mergeKnownRecordsArtifacts(artifacts);
  if (output === undefined || reportPath === undefined) throw new Error('output paths must not be empty');
  await mkdir(resolve(output, '..'), { recursive: true });
  await mkdir(resolve(reportPath, '..'), { recursive: true });
  await writeFile(resolve(output), `${JSON.stringify(merged.artifact)}\n`, 'utf8');
  await writeFile(resolve(reportPath), `${JSON.stringify(merged.report, null, 2)}\n`, 'utf8');
  console.log(`Merged ${merged.report.stats.uniquePairs} Known pairs into ${output}`);
  console.log(`Audit report: ${reportPath}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
