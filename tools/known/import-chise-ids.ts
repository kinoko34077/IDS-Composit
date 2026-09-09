import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ExternalKnownRecord, ExternalKnownSource } from './generate-index.ts';
import { generateKnownRecordsArtifact } from './generate-index.ts';
import { normalizeKnownLookupKey } from '../../src/known/normalize-lookup-key.ts';

export const CHISE_IDS_FILES = [
  'IDS-UCS-Basic.txt',
  'IDS-UCS-Ext-A.txt',
  'IDS-UCS-Ext-B-1.txt',
  'IDS-UCS-Ext-B-2.txt',
  'IDS-UCS-Ext-B-3.txt',
  'IDS-UCS-Ext-B-4.txt',
  'IDS-UCS-Ext-B-5.txt',
  'IDS-UCS-Ext-B-6.txt',
  'IDS-UCS-Ext-C.txt',
  'IDS-UCS-Ext-D.txt',
  'IDS-UCS-Ext-E.txt',
  'IDS-UCS-Ext-F.txt',
  'IDS-UCS-Ext-G.txt',
  'IDS-UCS-Ext-H.txt',
  'IDS-UCS-Ext-I.txt',
  'IDS-UCS-Ext-J.txt',
] as const;

export const DEFAULT_CHISE_IDS_REVISION = '352e13378e411c322cfa16bfd7a6d21d670d7eca';
export const DEFAULT_CHISE_IDS_VERSION = 'snapshot-2026-07-29';
export const DEFAULT_CHISE_IDS_BASE_URL = 'https://raw.githubusercontent.com/chise/ids';

export type ChiseIdsFile = {
  file: string;
  text: string;
};

export type ChiseIdsIssueKind =
  | 'malformed-row'
  | 'invalid-codepoint'
  | 'character-mismatch'
  | 'empty-field';

export type ChiseIdsWarningKind = 'missing-functional-ids';

export type ChiseIdsIssue = {
  file: string;
  line: number;
  kind: ChiseIdsIssueKind;
  message: string;
};

export type ChiseIdsWarning = {
  file: string;
  line: number;
  kind: ChiseIdsWarningKind;
  message: string;
};

export type ChiseIdsFileStats = {
  file: string;
  lines: number;
  comments: number;
  records: number;
  apparent: number;
  issues: number;
  warnings: number;
};

export type ChiseIdsParseResult = {
  records: ExternalKnownRecord[];
  /** The raw @apparent view is exposed for Calibration only; it is not a Known mapping. */
  apparentRecords: ChiseApparentRecord[];
  issues: ChiseIdsIssue[];
  warnings: ChiseIdsWarning[];
  stats: ChiseIdsFileStats;
};

export type ChiseApparentRecord = {
  ids: string;
  character: string;
  file: string;
  line: number;
};

export type ChiseIdsParseBundle = {
  files: ChiseIdsFile[];
  records: ExternalKnownRecord[];
  apparentRecords: ChiseApparentRecord[];
  issues: ChiseIdsIssue[];
  warnings: ChiseIdsWarning[];
  fileStats: ChiseIdsFileStats[];
};

export type KnownImportReport = {
  schemaVersion: 'ids-composit-known-import-report/v0.2';
  stats: {
    files: number;
    lines: number;
    comments: number;
    records: number;
    issues: number;
    warnings: number;
    apparent: number;
    uniquePairs: number;
    duplicatePairs: number;
    uniqueIds: number;
    ambiguousIds: number;
    uniquelyResolvableIds: number;
    uniquelyResolvableRate: number;
  };
  files: readonly ChiseIdsFileStats[];
  examples: {
    street: readonly string[];
  };
  resolutionSamples: readonly {
    ids: string;
    characters: readonly string[];
    kind: 'match' | 'ambiguous';
  }[];
  issues: readonly ChiseIdsIssue[];
  warnings: readonly ChiseIdsWarning[];
  source?: ExternalKnownSource;
};

export type FetchTextResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type FetchText = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<FetchTextResponse>;

export type DownloadChiseIdsOptions = {
  revision: string;
  files?: readonly string[];
  baseUrl?: string;
  concurrency?: number;
  timeoutMs?: number;
  fetchImpl?: FetchText;
};

export type CreateChiseIdsSourceOptions = {
  revision: string;
  version?: string;
  files: readonly string[];
  fileHash: string;
};

function parseCodePoint(value: string): number | undefined {
  const match = /^(?:U\+|U-)([0-9A-Fa-f]{4,8})$/.exec(value);
  if (match === null) return undefined;
  const codePoint = Number.parseInt(match[1]!, 16);
  if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return undefined;
  return codePoint;
}

function issue(
  file: string,
  line: number,
  kind: ChiseIdsIssueKind,
  message: string,
): ChiseIdsIssue {
  return { file, line, kind, message };
}

/**
 * Parse one CHISE IDS text file. Functional IDS values are imported; the
 * optional @apparent value is counted but deliberately not treated as an
 * additional mapping because CHISE documents it as a non-functional view.
 */
export function parseChiseIdsFile(text: string, file: string): ChiseIdsParseResult {
  const records: ExternalKnownRecord[] = [];
  const apparentRecords: ChiseApparentRecord[] = [];
  const issues: ChiseIdsIssue[] = [];
  const warnings: ChiseIdsWarning[] = [];
  let comments = 0;
  let apparent = 0;
  const lines = text.replace(/^\uFEFF/, '').split(/\r\n?|\n/);

  lines.forEach((rawLine, lineIndex) => {
    const line = lineIndex + 1;
    const trimmed = rawLine.trim();
    if (trimmed.length === 0 || trimmed.startsWith(';;')) {
      comments += 1;
      return;
    }

    const fields = rawLine.split('\t');
    if (fields.length < 3) {
      issues.push(issue(file, line, 'malformed-row', 'expected at least three tab-separated fields'));
      return;
    }

    const codePoint = parseCodePoint(fields[0]!);
    const sourceCharacter = fields[1]!;
    const ids = fields[2]!;
    const apparentFields = fields.slice(3).filter((field) => field.startsWith('@apparent=') && field.length > '@apparent='.length);
    apparent += apparentFields.length;
    if (codePoint === undefined) {
      issues.push(issue(file, line, 'invalid-codepoint', `invalid Unicode scalar value: ${fields[0]}`));
      return;
    }
    const character = String.fromCodePoint(codePoint);
    if (sourceCharacter.length > 0 && sourceCharacter !== character) {
      issues.push(issue(file, line, 'character-mismatch', `character field does not match ${fields[0]}`));
      return;
    }
    if (sourceCharacter.length > 0 && ids.length === 0 && apparentFields.length > 0) {
      apparentFields.forEach((field) => {
        apparentRecords.push({ ids: field.slice('@apparent='.length), character, file, line });
      });
      warnings.push({
        file,
        line,
        kind: 'missing-functional-ids',
        message: 'functional IDS is empty; apparent IDS is retained only as source metadata',
      });
      return;
    }
    if (sourceCharacter.length === 0 || ids.length === 0) {
      issues.push(issue(file, line, 'empty-field', 'character and IDS fields must not be empty'));
      return;
    }

    apparentFields.forEach((field) => {
      apparentRecords.push({ ids: field.slice('@apparent='.length), character, file, line });
    });
    records.push({ ids, character, status: 'verified' });
  });

  return {
    records,
    apparentRecords,
    issues,
    warnings,
    stats: {
      file,
      lines: lines.length,
      comments,
      records: records.length,
      apparent,
      issues: issues.length,
      warnings: warnings.length,
    },
  };
}

export function parseChiseIdsFiles(files: readonly ChiseIdsFile[]): ChiseIdsParseBundle {
  const results = files.map(({ file, text }) => parseChiseIdsFile(text, file));
  return {
    files: [...files],
    records: results.flatMap((result) => result.records),
    apparentRecords: results.flatMap((result) => result.apparentRecords),
    issues: results.flatMap((result) => result.issues),
    warnings: results.flatMap((result) => result.warnings),
    fileStats: results.map((result) => result.stats),
  };
}

export function computeSourceHash(files: readonly ChiseIdsFile[]): string {
  const hash = createHash('sha256');
  [...files]
    .sort((left, right) => left.file < right.file ? -1 : left.file > right.file ? 1 : 0)
    .forEach(({ file, text }) => {
      hash.update(file, 'utf8');
      hash.update('\u0000', 'utf8');
      hash.update(text, 'utf8');
      hash.update('\u0000', 'utf8');
    });
  return `sha256:${hash.digest('hex')}`;
}

export function createChiseIdsSource(options: CreateChiseIdsSourceOptions): ExternalKnownSource {
  return {
    name: 'CHISE IDS database',
    version: options.version ?? DEFAULT_CHISE_IDS_VERSION,
    retrievalMethod: 'HTTPS raw download from a pinned repository revision',
    fileHash: options.fileHash,
    repository: 'https://github.com/chise/ids',
    revision: options.revision,
    license: 'GPL-2.0-or-later',
    files: [...options.files].sort(),
  };
}

export function buildKnownImportReport(
  parsed: ChiseIdsParseBundle,
  records: readonly ExternalKnownRecord[] = parsed.records,
): KnownImportReport {
  const pairs = new Set<string>();
  const byIds = new Map<string, Set<string>>();
  for (const record of records) {
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
  const resolutionSamples = sortedIds.slice(0, 20).map((ids) => {
    const characters = [...(byIds.get(ids) ?? [])].sort();
    return {
      ids,
      characters,
      kind: characters.length > 1 ? 'ambiguous' as const : 'match' as const,
    };
  });

  return {
    schemaVersion: 'ids-composit-known-import-report/v0.2',
    stats: {
      files: parsed.files.length,
      lines: parsed.fileStats.reduce((total, stats) => total + stats.lines, 0),
      comments: parsed.fileStats.reduce((total, stats) => total + stats.comments, 0),
      records: records.length,
      issues: parsed.issues.length,
      warnings: parsed.warnings.length,
      apparent: parsed.fileStats.reduce((total, stats) => total + stats.apparent, 0),
      uniquePairs: pairs.size,
      duplicatePairs: records.length - pairs.size,
      uniqueIds: sortedIds.length,
      ambiguousIds: ambiguousIds.length,
      uniquelyResolvableIds: uniquelyResolvableIds.length,
      uniquelyResolvableRate: sortedIds.length === 0 ? 0 : uniquelyResolvableIds.length / sortedIds.length,
    },
    files: parsed.fileStats,
    examples: {
      street: records
        .filter((record) => normalizeKnownLookupKey(record.character) === '街')
        .map((record) => record.ids)
        .sort(),
    },
    resolutionSamples,
    issues: parsed.issues,
    warnings: parsed.warnings,
  };
}

async function fetchTextWithTimeout(
  fetchImpl: FetchText,
  url: string,
  timeoutMs: number,
  file: string,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`CHISE IDS download failed for ${file}: HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`CHISE IDS download timed out for ${file}`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadChiseIdsFiles(options: DownloadChiseIdsOptions): Promise<ChiseIdsFile[]> {
  const files = [...(options.files ?? CHISE_IDS_FILES)];
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? 4));
  const timeoutMs = Math.max(1, options.timeoutMs ?? 30_000);
  const baseUrl = (options.baseUrl ?? DEFAULT_CHISE_IDS_BASE_URL).replace(/\/+$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;
  const results: Array<ChiseIdsFile | undefined> = new Array(files.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < files.length) {
      const index = nextIndex;
      nextIndex += 1;
      const file = files[index]!;
      const url = `${baseUrl}/${options.revision}/${encodeURIComponent(file)}`;
      results[index] = {
        file,
        text: await fetchTextWithTimeout(fetchImpl, url, timeoutMs, file),
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()));
  return results.filter((file): file is ChiseIdsFile => file !== undefined);
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run known:import:chise -- [--revision SHA] [--output FILE] [--report FILE]');
    return;
  }

  const revision = argumentValue(args, '--revision') ?? DEFAULT_CHISE_IDS_REVISION;
  const output = argumentValue(args, '--output') ?? 'data/known/generated/chise-ids-v0.2.json';
  const reportPath = argumentValue(args, '--report') ?? 'data/known/reports/chise-ids-v0.2.json';
  const files = await downloadChiseIdsFiles({ revision });
  const parsed = parseChiseIdsFiles(files);
  const source = createChiseIdsSource({
    revision,
    files: files.map(({ file }) => file),
    fileHash: computeSourceHash(files),
  });
  const report: KnownImportReport = { ...buildKnownImportReport(parsed), source };
  await mkdir(resolve(reportPath, '..'), { recursive: true });
  await writeFile(resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (parsed.issues.length > 0) {
    throw new Error(`CHISE IDS import stopped with ${parsed.issues.length} source issue(s); see ${reportPath}`);
  }

  const artifact = generateKnownRecordsArtifact(parsed.records, source);
  await mkdir(resolve(output, '..'), { recursive: true });
  await writeFile(resolve(output), `${JSON.stringify(artifact)}\n`, 'utf8');
  console.log(`Imported ${artifact.records.length} CHISE IDS records into ${output}`);
  console.log(`Audit report: ${reportPath}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
