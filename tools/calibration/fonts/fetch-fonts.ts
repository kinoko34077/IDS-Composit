import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export type CalibrationFontManifestEntry = {
  id: string;
  family: string;
  version: string;
  region: 'JP';
  weight: 'Regular';
  format: 'static OTF';
  upstream: string;
  release: string;
  license: string;
  assetUrl: string;
  archiveFile: string;
  assetFile: string;
  archiveSha256: `sha256:${string}`;
  expectedSha256: `sha256:${string}`;
};

export type CalibrationFontManifest = {
  schemaVersion: 'ids-composit-calibration-fonts/v0.2';
  fonts: CalibrationFontManifestEntry[];
};

export const DEFAULT_CALIBRATION_FONT_MANIFEST = resolve('tools/calibration/fonts/manifest.json');
export const DEFAULT_CALIBRATION_FONT_CACHE = resolve('.cache/calibration-fonts');

function isSha256(value: unknown): value is `sha256:${string}` {
  return typeof value === 'string' && /^sha256:[0-9a-f]{64}$/u.test(value);
}

function assertManifestEntry(value: unknown, index: number): CalibrationFontManifestEntry {
  if (typeof value !== 'object' || value === null) throw new Error(`Calibration font manifest entry ${index} must be an object`);
  const entry = value as Partial<CalibrationFontManifestEntry>;
  const required = ['id', 'family', 'version', 'region', 'weight', 'format', 'upstream', 'release', 'license', 'assetUrl', 'archiveFile', 'assetFile'] as const;
  for (const field of required) {
    if (typeof entry[field] !== 'string' || entry[field].trim().length === 0) {
      throw new Error(`Calibration font manifest entry ${index} is missing ${field}`);
    }
  }
  if (entry.region !== 'JP' || entry.weight !== 'Regular' || entry.format !== 'static OTF') {
    throw new Error(`Calibration font manifest entry ${index} must be a JP Regular static OTF`);
  }
  if (!isSha256(entry.archiveSha256) || !isSha256(entry.expectedSha256)) {
    throw new Error(`Calibration font manifest entry ${index} must contain SHA-256 values`);
  }
  return entry as CalibrationFontManifestEntry;
}

export function validateCalibrationFontManifest(value: unknown): CalibrationFontManifest {
  if (typeof value !== 'object' || value === null) throw new Error('Calibration font manifest must be an object');
  const manifest = value as Partial<CalibrationFontManifest>;
  if (manifest.schemaVersion !== 'ids-composit-calibration-fonts/v0.2' || !Array.isArray(manifest.fonts)) {
    throw new Error('Unsupported Calibration font manifest');
  }
  return {
    schemaVersion: manifest.schemaVersion,
    fonts: manifest.fonts.map(assertManifestEntry),
  };
}

export async function readCalibrationFontManifest(
  manifestPath = DEFAULT_CALIBRATION_FONT_MANIFEST,
): Promise<CalibrationFontManifest> {
  return validateCalibrationFontManifest(JSON.parse(await readFile(manifestPath, 'utf8')) as unknown);
}

export function getCalibrationFont(
  manifest: CalibrationFontManifest,
  id: string,
): CalibrationFontManifestEntry {
  const font = manifest.fonts.find((candidate) => candidate.id === id);
  if (font === undefined) throw new Error(`Unknown Calibration font: ${id}`);
  return font;
}

export async function calculateFileSha256(filePath: string): Promise<`sha256:${string}`> {
  const digest = createHash('sha256').update(await readFile(filePath)).digest('hex');
  return `sha256:${digest}`;
}

export async function assertExpectedSha256(filePath: string, expected: `sha256:${string}`): Promise<void> {
  const actual = await calculateFileSha256(filePath);
  if (actual !== expected) throw new Error(`Calibration font hash mismatch for ${filePath}: expected ${expected}, received ${actual}`);
}

function runProcess(command: string, args: readonly string[]): Promise<void> {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(command, [...args], { stdio: 'ignore', windowsHide: true });
    child.once('error', rejectProcess);
    child.once('exit', (code) => {
      if (code === 0) resolveProcess();
      else rejectProcess(new Error(`Calibration font extraction failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

function quotePowerShell(value: string): string {
  return `'${value.replace(/'/gu, "''")}'`;
}

async function extractZip(archivePath: string, outputDirectory: string): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  if (process.platform === 'win32') {
    await runProcess('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Expand-Archive -LiteralPath ${quotePowerShell(archivePath)} -DestinationPath ${quotePowerShell(outputDirectory)} -Force`,
    ]);
    return;
  }
  await runProcess('unzip', ['-o', archivePath, '-d', outputDirectory]);
}

export type EnsureCalibrationFontOptions = {
  cacheDirectory?: string;
  fetchImpl?: typeof fetch;
};

/** Download, verify, extract, and verify one manifest font. */
export async function ensureCalibrationFont(
  font: CalibrationFontManifestEntry,
  options: EnsureCalibrationFontOptions = {},
): Promise<string> {
  const cacheDirectory = options.cacheDirectory ?? DEFAULT_CALIBRATION_FONT_CACHE;
  const archivePath = join(cacheDirectory, font.archiveFile);
  const extractionDirectory = join(cacheDirectory, font.id);
  const fontPath = join(extractionDirectory, ...font.assetFile.split(/[\\/]/u));
  const fetcher = options.fetchImpl ?? fetch;

  if (!(await fileExists(archivePath))) {
    const response = await fetcher(font.assetUrl);
    if (!response.ok) throw new Error(`Calibration font download failed: HTTP ${response.status} ${font.assetUrl}`);
    await mkdir(dirname(archivePath), { recursive: true });
    await writeFile(archivePath, new Uint8Array(await response.arrayBuffer()));
  }
  await assertExpectedSha256(archivePath, font.archiveSha256);
  if (!(await fileExists(fontPath))) await extractZip(archivePath, extractionDirectory);
  await assertExpectedSha256(fontPath, font.expectedSha256);
  return isAbsolute(fontPath) ? fontPath : resolve(fontPath);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath, { flag: 'r' });
    return true;
  } catch {
    return false;
  }
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run calibration:verify-fonts -- [--id FONT_ID]');
    return;
  }
  const manifest = await readCalibrationFontManifest();
  const requestedId = argumentValue(args, '--id');
  const fonts = requestedId === undefined
    ? manifest.fonts
    : [getCalibrationFont(manifest, requestedId)];
  for (const font of fonts) {
    const path = await ensureCalibrationFont(font);
    console.log(`Verified ${font.id}: ${path}`);
  }
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
