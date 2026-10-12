/** Read-only, exact-byte verification for tracked merged Known artifacts.
 *
 * Wave1 writeback preparation (IDS-Composit#11). Reads fixed tracked inputs,
 * regenerates only in memory, and never writes files or invokes GitHub.
 */
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { GeneratedKnownRecordsArtifact } from './generate-index.ts';
import { mergeKnownRecordsArtifacts } from './merge-known-sources.ts';

const SOURCE_PATHS = [
  'data/known/generated/chise-ids-v0.2.json',
  'data/known/generated/babelstone-ids-v0.2.json',
  'data/known/generated/yibai-lv2-v0.2.json',
] as const;

const OUTPUT_PATHS = [
  'data/known/generated/known-index-v0.2.json',
  'data/known/reports/known-index-v0.2.json',
] as const;

function digest(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function readRegular(path: string): Promise<Buffer> {
  const fullPath = resolve(process.cwd(), path);
  const info = await lstat(fullPath);
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error(`Expected a regular tracked file: ${path}`);
  }
  return readFile(fullPath);
}

function parseSource(path: string, bytes: Buffer): GeneratedKnownRecordsArtifact {
  const value: unknown = JSON.parse(bytes.toString('utf8'));
  if (
    typeof value !== 'object' || value === null ||
    !('schemaVersion' in value) ||
    value.schemaVersion !== 'ids-composit-known-records/v0.2' ||
    !('source' in value) ||
    typeof value.source !== 'object' || value.source === null ||
    !('name' in value.source) || typeof value.source.name !== 'string' ||
    !('records' in value) || !Array.isArray(value.records)
  ) {
    throw new Error(`Invalid fixed Known source artifact: ${path}`);
  }
  return value as GeneratedKnownRecordsArtifact;
}

export async function checkKnownMerge(): Promise<void> {
  const inputs = await Promise.all(SOURCE_PATHS.map(async (path) =>
    parseSource(path, await readRegular(path))));
  const merged = mergeKnownRecordsArtifacts(inputs);

  const expectedContents = [
    `${JSON.stringify(merged.artifact)}\n`,
    `${JSON.stringify(merged.report, null, 2)}\n`,
  ];
  let stale = false;

  for (let index = 0; index < OUTPUT_PATHS.length; index += 1) {
    const path = OUTPUT_PATHS[index]!;
    const expected = Buffer.from(expectedContents[index]!, 'utf8');
    const actual = await readRegular(path);

    if (!actual.equals(expected)) {
      stale = true;
      console.error(`STALE ${path}: expected sha256=${digest(expected)}; actual sha256=${digest(actual)}`);
    } else {
      console.log(`PASS ${path}: ${actual.length} bytes sha256=${digest(actual)}`);
    }
  }
  if (stale) {
    throw new Error('Tracked Known merged artifacts differ from their fixed-source regeneration');
  }
}

const entry = process.argv[1];
if (entry !== undefined && resolve(entry) === resolve(new URL(import.meta.url).pathname)) {
  checkKnownMerge().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
