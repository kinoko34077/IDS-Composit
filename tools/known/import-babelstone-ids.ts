import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { FetchText } from './import-chise-ids.ts';
import type { ExternalKnownRecord, ExternalKnownSource } from './generate-index.ts';
import { generateKnownRecordsArtifact } from './generate-index.ts';
import { analyzeExternalIds, sha256Text } from './external-ids.ts';
import { normalizeKnownLookupKey } from '../../src/known/normalize-lookup-key.ts';

export const DEFAULT_BABELSTONE_IDS_URL = 'https://www.babelstone.co.uk/CJK/IDS.TXT';
export const DEFAULT_BABELSTONE_IDS_VERSION = 'Unicode-16.0-file-2025-06-27';
export const DEFAULT_BABELSTONE_IDS_REVISION = 'file-date-2025-06-27';

export type BabelStoneIdsIssueKind =
  | 'malformed-row'
  | 'invalid-codepoint'
  | 'character-mismatch'
  | 'malformed-ids';

export type BabelStoneIdsIssue = {
  file: string;
  line: number;
  kind: BabelStoneIdsIssueKind;
  message: string;
};

export type BabelStoneIdsFileStats = {
  file: string;
  lines: number;
  comments: number;
  notes: number;
  records: number;
  verified: number;
  candidate: number;
  specialComponents: number;
  unsupportedStructuralIdc: number;
  issues: number;
};

export type BabelStoneIdsParseResult = {
  records: ExternalKnownRecord[];
  issues: BabelStoneIdsIssue[];
  stats: BabelStoneIdsFileStats;
};

export type BabelStoneImportReport = {
  schemaVersion: 'ids-composit-babelstone-import-report/v0.2';
  stats: {
    files: number;
    lines: number;
    comments: number;
    notes: number;
    records: number;
    uniquePairs: number;
    duplicatePairs: number;
    uniqueIds: number;
    ambiguousIds: number;
    uniquelyResolvableIds: number;
    uniquelyResolvableRate: number;
    verified: number;
    candidate: number;
    specialComponents: number;
    unsupportedStructuralIdc: number;
    issues: number;
  };
  files: readonly BabelStoneIdsFileStats[];
  examples: { street: readonly string[] };
  resolutionSamples: readonly {
    ids: string;
    characters: readonly string[];
    kind: 'match' | 'ambiguous';
  }[];
  issues: readonly BabelStoneIdsIssue[];
  source?: ExternalKnownSource;
};

export type DownloadBabelStoneIdsOptions = {
  url?: string;
  timeoutMs?: number;
  fetchImpl?: FetchText;
};

export type CreateBabelStoneSourceOptions = {
  fileHash: string;
};

function parseCodePoint(value: string): number | undefined {
  const match = /^U\+([0-9A-Fa-f]{4,8})$/u.exec(value);
  if (match === null) return undefined;
  const codePoint = Number.parseInt(match[1]!, 16);
  if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return undefined;
  return codePoint;
}

function issue(file: string, line: number, kind: BabelStoneIdsIssueKind, message: string): BabelStoneIdsIssue {
  return { file, line, kind, message };
}

function parseSequenceField(value: string): {
  record?: Omit<ExternalKnownRecord, 'character'>;
  issue?: string;
  specialComponent: boolean;
  unsupportedStructuralIdc: boolean;
} {
  const match = /^\^(.+?)\$(?:\(([^()]*)\))?$/u.exec(value.trim());
  if (match === null) {
    return { issue: 'IDS field must use ^…$ delimiters', specialComponent: false, unsupportedStructuralIdc: false };
  }

  const ids = match[1]!;
  const analysis = analyzeExternalIds(ids);
  if (!analysis.wellFormed && !analysis.hasSpecialComponent) {
    return { issue: 'IDS sequence has invalid structure', specialComponent: false, unsupportedStructuralIdc: analysis.unsupportedStructuralIdc.length > 0 };
  }

  return {
    record: {
      ids,
      status: analysis.hasSpecialComponent ? 'candidate' : 'verified',
      ...(match[2] === undefined || match[2].length === 0 ? {} : { variantTag: match[2] }),
    },
    specialComponent: analysis.hasSpecialComponent,
    unsupportedStructuralIdc: analysis.unsupportedStructuralIdc.length > 0,
  };
}

export function parseBabelStoneIdsFile(text: string, file = 'IDS.TXT'): BabelStoneIdsParseResult {
  const records: ExternalKnownRecord[] = [];
  const issues: BabelStoneIdsIssue[] = [];
  let comments = 0;
  let notes = 0;
  let specialComponents = 0;
  let unsupportedStructuralIdc = 0;
  const lines = text.replace(/^\uFEFF/u, '').split(/\r\n?|\n/u);

  lines.forEach((rawLine, lineIndex) => {
    const line = lineIndex + 1;
    const trimmed = rawLine.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      comments += 1;
      return;
    }

    const fields = rawLine.split('\t');
    if (fields.length < 3) {
      issues.push(issue(file, line, 'malformed-row', 'expected code point, character, and at least one IDS field'));
      return;
    }

    const codePoint = parseCodePoint(fields[0]!.trim());
    if (codePoint === undefined) {
      issues.push(issue(file, line, 'invalid-codepoint', `invalid Unicode scalar value: ${fields[0]}`));
      return;
    }
    const sourceCharacter = fields[1]!;
    const character = String.fromCodePoint(codePoint);
    if (sourceCharacter !== character) {
      issues.push(issue(file, line, `character-mismatch`, `character field does not match ${fields[0]}`));
      return;
    }

    let rowRecords = 0;
    let sawIdsValue = false;
    for (const field of fields.slice(2)) {
      const value = field.trim();
      if (value.length === 0) continue;
      if (value.startsWith('*')) {
        notes += 1;
        continue;
      }
      sawIdsValue = true;
      const parsed = parseSequenceField(value);
      if (parsed.issue !== undefined) {
        issues.push(issue(file, line, 'malformed-ids', parsed.issue));
        continue;
      }
      if (parsed.record === undefined) continue;
      records.push({ ...parsed.record, character });
      rowRecords += 1;
      if (parsed.specialComponent) specialComponents += 1;
      if (parsed.unsupportedStructuralIdc) unsupportedStructuralIdc += 1;
    }
    if (rowRecords === 0 && !sawIdsValue) {
      issues.push(issue(file, line, 'malformed-row', 'row contains no usable IDS field'));
    }
  });

  return {
    records,
    issues,
    stats: {
      file,
      lines: lines.length,
      comments,
      notes,
      records: records.length,
      verified: records.filter((record) => record.status === 'verified').length,
      candidate: records.filter((record) => record.status === 'candidate').length,
      specialComponents,
      unsupportedStructuralIdc,
      issues: issues.length,
    },
  };
}

export function computeBabelStoneSourceHash(text: string): string {
  return sha256Text(text);
}

export function createBabelStoneSource(options: CreateBabelStoneSourceOptions): ExternalKnownSource {
  return {
    name: 'BabelStone IDS',
    version: DEFAULT_BABELSTONE_IDS_VERSION,
    retrievalMethod: 'HTTPS download of the pinned upstream file-date snapshot',
    fileHash: options.fileHash,
    repository: 'https://www.babelstone.co.uk/CJK/index.html',
    revision: DEFAULT_BABELSTONE_IDS_REVISION,
    license: 'BabelStone IDS data terms',
    files: ['IDS.TXT'],
  };
}

export function buildBabelStoneImportReport(
  parsed: BabelStoneIdsParseResult,
  source?: ExternalKnownSource,
): BabelStoneImportReport {
  const pairs = new Set<string>();
  const byIds = new Map<string, Set<string>>();
  for (const record of parsed.records) {
    const ids = normalizeKnownLookupKey(record.ids);
    const character = normalizeKnownLookupKey(record.character);
    pairs.add(`${ids}\u0000${character}`);
    const characters = byIds.get(ids) ?? new Set<string>();
    characters.add(character);
    byIds.set(ids, characters);
  }
  const sortedIds = [...byIds.keys()].sort();
  const ambiguousIds = sortedIds.filter((ids) => (byIds.get(ids)?.size ?? 0) > 1);
  const uniquelyResolvableIds = sortedIds.filter((ids) => byIds.get(ids)?.size === 1);

  return {
    schemaVersion: 'ids-composit-babelstone-import-report/v0.2',
    stats: {
      files: 1,
      lines: parsed.stats.lines,
      comments: parsed.stats.comments,
      notes: parsed.stats.notes,
      records: parsed.records.length,
      uniquePairs: pairs.size,
      duplicatePairs: parsed.records.length - pairs.size,
      uniqueIds: sortedIds.length,
      ambiguousIds: ambiguousIds.length,
      uniquelyResolvableIds: uniquelyResolvableIds.length,
      uniquelyResolvableRate: sortedIds.length === 0 ? 0 : uniquelyResolvableIds.length / sortedIds.length,
      verified: parsed.stats.verified,
      candidate: parsed.stats.candidate,
      specialComponents: parsed.stats.specialComponents,
      unsupportedStructuralIdc: parsed.stats.unsupportedStructuralIdc,
      issues: parsed.issues.length,
    },
    files: [parsed.stats],
    examples: {
      street: [...new Set(parsed.records
        .filter((record) => normalizeKnownLookupKey(record.character) === '街')
        .map((record) => record.ids))].sort(),
    },
    resolutionSamples: sortedIds.slice(0, 20).map((ids) => {
      const characters = [...(byIds.get(ids) ?? [])].sort();
      return { ids, characters, kind: characters.length > 1 ? 'ambiguous' : 'match' };
    }),
    issues: parsed.issues,
    ...(source === undefined ? {} : { source }),
  };
}

export function dedupeBabelStoneRecords(records: readonly ExternalKnownRecord[]): ExternalKnownRecord[] {
  const byPair = new Map<string, ExternalKnownRecord>();
  for (const record of records) {
    const key = `${normalizeKnownLookupKey(record.ids)}\u0000${normalizeKnownLookupKey(record.character)}`;
    const previous = byPair.get(key);
    const status = previous?.status === 'verified' || record.status === 'verified' ? 'verified' : 'candidate';
    const tags = new Set<string>();
    for (const tag of [previous?.variantTag, record.variantTag]) {
      if (tag !== undefined) tags.add(tag);
    }
    byPair.set(key, {
      ids: previous?.ids ?? record.ids,
      character: previous?.character ?? record.character,
      status,
      ...(tags.size === 0 ? {} : { variantTag: [...tags].sort().join('|') }),
    });
  }
  return [...byPair.values()].sort((left, right) => `${left.ids}\u0000${left.character}`.localeCompare(`${right.ids}\u0000${right.character}`));
}

async function fetchTextWithTimeout(fetchImpl: FetchText, url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`BabelStone IDS download failed: HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('BabelStone IDS download timed out');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadBabelStoneIds(options: DownloadBabelStoneIdsOptions = {}): Promise<{ file: 'IDS.TXT'; text: string }> {
  const url = options.url ?? DEFAULT_BABELSTONE_IDS_URL;
  const text = await fetchTextWithTimeout(options.fetchImpl ?? fetch, url, Math.max(1, options.timeoutMs ?? 30_000));
  return { file: 'IDS.TXT', text };
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run known:import:babelstone -- [--output FILE] [--report FILE]');
    return;
  }

  const output = argumentValue(args, '--output') ?? 'data/known/generated/babelstone-ids-v0.2.json';
  const reportPath = argumentValue(args, '--report') ?? 'data/known/reports/babelstone-ids-v0.2.json';
  const file = await downloadBabelStoneIds();
  const parsed = parseBabelStoneIdsFile(file.text, file.file);
  const source = createBabelStoneSource({ fileHash: computeBabelStoneSourceHash(file.text) });
  const report = buildBabelStoneImportReport(parsed, source);
  await mkdir(resolve(reportPath, '..'), { recursive: true });
  await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (parsed.issues.length > 0) throw new Error(`BabelStone IDS import stopped with ${parsed.issues.length} source issue(s); see ${reportPath}`);
  const artifact = generateKnownRecordsArtifact(dedupeBabelStoneRecords(parsed.records), source);
  await mkdir(resolve(output, '..'), { recursive: true });
  await writeFile(resolve(output), `${JSON.stringify(artifact)}\n`, 'utf8');
  console.log(`Imported ${artifact.records.length} BabelStone IDS records into ${output}`);
  console.log(`Audit report: ${reportPath}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
