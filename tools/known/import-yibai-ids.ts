import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { FetchText } from './import-chise-ids.ts';
import type { ExternalKnownRecord, ExternalKnownSource } from './generate-index.ts';
import { generateKnownRecordsArtifact } from './generate-index.ts';
import {
  analyzeExternalIds,
  hasYiBaiSpecialSyntax,
  normalizeYiBaiCore,
  sha256Text,
  splitYiBaiSequence,
} from './external-ids.ts';
import { normalizeKnownLookupKey } from '../../src/known/normalize-lookup-key.ts';

export const DEFAULT_YIBAI_IDS_REVISION = '13081e8b223b740fcc234780b95a386d895fbf16d';
export const DEFAULT_YIBAI_IDS_VERSION = 'snapshot-2026-09-01';
export const DEFAULT_YIBAI_IDS_BASE_URL = 'https://raw.githubusercontent.com/yi-bai/ids';
export const YIBAI_LEVELS = ['lv0', 'lv1', 'lv2'] as const;
export type YiBaiLevel = typeof YIBAI_LEVELS[number];

export type YiBaiIdsIssueKind = 'malformed-row' | 'invalid-character' | 'malformed-ids';

export type YiBaiIdsIssue = {
  file: string;
  line: number;
  kind: YiBaiIdsIssueKind;
  message: string;
};

export type YiBaiIdsFileStats = {
  file: string;
  level: YiBaiLevel;
  lines: number;
  comments: number;
  records: number;
  primary: number;
  alternative: number;
  verified: number;
  candidate: number;
  specialSyntax: number;
  unsupportedStructuralIdc: number;
  issues: number;
};

export type YiBaiIdsParseResult = {
  records: ExternalKnownRecord[];
  issues: YiBaiIdsIssue[];
  stats: YiBaiIdsFileStats;
};

export type YiBaiImportReport = {
  schemaVersion: 'ids-composit-yibai-import-report/v0.2';
  level: YiBaiLevel;
  stats: {
    files: number;
    lines: number;
    comments: number;
    records: number;
    uniquePairs: number;
    duplicatePairs: number;
    uniqueIds: number;
    ambiguousIds: number;
    uniquelyResolvableIds: number;
    uniquelyResolvableRate: number;
    primary: number;
    alternative: number;
    verified: number;
    candidate: number;
    specialSyntax: number;
    unsupportedStructuralIdc: number;
    issues: number;
  };
  files: readonly YiBaiIdsFileStats[];
  examples: { street: readonly string[] };
  resolutionSamples: readonly {
    ids: string;
    characters: readonly string[];
    kind: 'match' | 'ambiguous';
  }[];
  issues: readonly YiBaiIdsIssue[];
  source?: ExternalKnownSource;
};

export type DownloadYiBaiIdsOptions = {
  revision: string;
  level: YiBaiLevel;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: FetchText;
};

export type CreateYiBaiSourceOptions = {
  revision: string;
  level: YiBaiLevel;
  fileHash: string;
};

function issue(file: string, line: number, kind: YiBaiIdsIssueKind, message: string): YiBaiIdsIssue {
  return { file, line, kind, message };
}

function isSingleUnicodeScalar(value: string): boolean {
  const tokens = Array.from(value);
  if (tokens.length !== 1) return false;
  const codePoint = tokens[0]!.codePointAt(0);
  return codePoint !== undefined && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
}

function parseSequence(raw: string, side: 'primary' | 'alternative', level: YiBaiLevel): {
  record?: Omit<ExternalKnownRecord, 'character'>;
  issue?: string;
  specialSyntax: boolean;
  unsupportedStructuralIdc: boolean;
} {
  const parts = splitYiBaiSequence(raw);
  if (parts.core.length === 0 || parts.unbalancedParentheses) {
    return { issue: 'IDS sequence has invalid annotation syntax', specialSyntax: true, unsupportedStructuralIdc: false };
  }

  const normalized = normalizeYiBaiCore(parts.core);
  const specialSyntax = hasYiBaiSpecialSyntax(parts.core, normalized);
  const analysis = analyzeExternalIds(normalized);
  const opaqueSyntax = /[#{}？?\[\]:-]/u.test(parts.core);

  if (!analysis.wellFormed && !specialSyntax) {
    return { issue: 'IDS sequence has invalid structure', specialSyntax: false, unsupportedStructuralIdc: analysis.unsupportedStructuralIdc.length > 0 };
  }

  const ids = opaqueSyntax ? parts.core : normalized;
  const status = level === 'lv2' && !specialSyntax && analysis.wellFormed ? 'verified' : 'candidate';
  const indicators = [side, ...parts.indicators].join(';');
  return {
    record: {
      ids,
      status,
      variantTag: indicators,
    },
    specialSyntax,
    unsupportedStructuralIdc: analysis.unsupportedStructuralIdc.length > 0,
  };
}

export function parseYiBaiIdsFile(text: string, file: string, level: YiBaiLevel): YiBaiIdsParseResult {
  const records: ExternalKnownRecord[] = [];
  const issues: YiBaiIdsIssue[] = [];
  let comments = 0;
  let primary = 0;
  let alternative = 0;
  let specialSyntax = 0;
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
    if (fields.length < 2) {
      issues.push(issue(file, line, 'malformed-row', 'expected character and primary/alternative IDS columns'));
      return;
    }
    const character = fields[0]!.trim();
    if (!isSingleUnicodeScalar(character)) {
      issues.push(issue(file, line, 'invalid-character', 'first column must contain exactly one Unicode scalar'));
      return;
    }

    let rowRecords = 0;
    let sawSequenceValue = false;
    const columns: Array<['primary' | 'alternative', string | undefined]> = [
      ['primary', fields[1]],
      ['alternative', fields[2]],
    ];
    for (const [side, value] of columns) {
      if (value === undefined || value.trim().length === 0) continue;
      for (const rawSequence of value.split(';')) {
        if (rawSequence.trim().length === 0) continue;
        sawSequenceValue = true;
        const parsed = parseSequence(rawSequence, side, level);
        if (parsed.issue !== undefined) {
          issues.push(issue(file, line, 'malformed-ids', parsed.issue));
          continue;
        }
        if (parsed.record === undefined) continue;
        records.push({ ...parsed.record, character });
        rowRecords += 1;
        if (side === 'primary') primary += 1;
        else alternative += 1;
        if (parsed.specialSyntax) specialSyntax += 1;
        if (parsed.unsupportedStructuralIdc) unsupportedStructuralIdc += 1;
      }
    }
    if (rowRecords === 0 && !sawSequenceValue) {
      issues.push(issue(file, line, 'malformed-row', 'row contains no usable IDS sequence'));
    }
  });

  return {
    records,
    issues,
    stats: {
      file,
      level,
      lines: lines.length,
      comments,
      records: records.length,
      primary,
      alternative,
      verified: records.filter((record) => record.status === 'verified').length,
      candidate: records.filter((record) => record.status === 'candidate').length,
      specialSyntax,
      unsupportedStructuralIdc,
      issues: issues.length,
    },
  };
}

export function computeYiBaiSourceHash(text: string): string {
  return sha256Text(text);
}

export function createYiBaiSource(options: CreateYiBaiSourceOptions): ExternalKnownSource {
  return {
    name: `Yi Bai IDS ${options.level}`,
    version: `${DEFAULT_YIBAI_IDS_VERSION}-${options.level}`,
    retrievalMethod: 'HTTPS raw download from a pinned repository revision',
    fileHash: options.fileHash,
    repository: 'https://github.com/yi-bai/ids',
    revision: options.revision,
    license: 'MIT',
    files: [`ids_${options.level}.txt`],
  };
}

export function buildYiBaiImportReport(
  parsed: YiBaiIdsParseResult,
  source?: ExternalKnownSource,
): YiBaiImportReport {
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
    schemaVersion: 'ids-composit-yibai-import-report/v0.2',
    level: parsed.stats.level,
    stats: {
      files: 1,
      lines: parsed.stats.lines,
      comments: parsed.stats.comments,
      records: parsed.records.length,
      uniquePairs: pairs.size,
      duplicatePairs: parsed.records.length - pairs.size,
      uniqueIds: sortedIds.length,
      ambiguousIds: ambiguousIds.length,
      uniquelyResolvableIds: uniquelyResolvableIds.length,
      uniquelyResolvableRate: sortedIds.length === 0 ? 0 : uniquelyResolvableIds.length / sortedIds.length,
      primary: parsed.stats.primary,
      alternative: parsed.stats.alternative,
      verified: parsed.stats.verified,
      candidate: parsed.stats.candidate,
      specialSyntax: parsed.stats.specialSyntax,
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

export function dedupeYiBaiRecords(records: readonly ExternalKnownRecord[]): ExternalKnownRecord[] {
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

async function fetchTextWithTimeout(fetchImpl: FetchText, url: string, timeoutMs: number, level: YiBaiLevel): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Yi Bai IDS download failed for ${level}: HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`Yi Bai IDS download timed out for ${level}`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadYiBaiIds(options: DownloadYiBaiIdsOptions): Promise<{ file: `ids_${YiBaiLevel}.txt`; text: string }> {
  const baseUrl = (options.baseUrl ?? DEFAULT_YIBAI_IDS_BASE_URL).replace(/\/+$/u, '');
  const file = `ids_${options.level}.txt` as const;
  const url = `${baseUrl}/${options.revision}/${file}`;
  const text = await fetchTextWithTimeout(options.fetchImpl ?? fetch, url, Math.max(1, options.timeoutMs ?? 30_000), options.level);
  return { file, text };
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run known:import:yibai -- [--revision SHA] [--output-dir DIR] [--report-dir DIR]');
    return;
  }
  const revision = argumentValue(args, '--revision') ?? DEFAULT_YIBAI_IDS_REVISION;
  const outputDir = argumentValue(args, '--output-dir') ?? 'data/known/generated';
  const reportDir = argumentValue(args, '--report-dir') ?? 'data/known/reports';
  for (const level of YIBAI_LEVELS) {
    const file = await downloadYiBaiIds({ revision, level });
    const parsed = parseYiBaiIdsFile(file.text, file.file, level);
    const source = createYiBaiSource({ revision, level, fileHash: computeYiBaiSourceHash(file.text) });
    const report = buildYiBaiImportReport(parsed, source);
    const output = `${outputDir}/yibai-${level}-v0.2.json`;
    const reportPath = `${reportDir}/yibai-${level}-v0.2.json`;
    await mkdir(resolve(reportPath, '..'), { recursive: true });
    await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    if (parsed.issues.length > 0) throw new Error(`Yi Bai ${level} import stopped with ${parsed.issues.length} source issue(s); see ${reportPath}`);
    const artifact = generateKnownRecordsArtifact(dedupeYiBaiRecords(parsed.records), source);
    await mkdir(resolve(output, '..'), { recursive: true });
    await writeFile(resolve(output), `${JSON.stringify(artifact)}\n`, 'utf8');
    console.log(`Imported ${artifact.records.length} Yi Bai ${level} records into ${output}`);
    console.log(`Audit report: ${reportPath}`);
  }
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
