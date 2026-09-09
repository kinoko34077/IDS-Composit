import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseIds } from '../../src/parser/parse-ids.ts';
import { createCalibrationCanvas, registerCalibrationFont } from './fonts/canvas-backend.ts';
import { checkFontCoverage } from './fonts/coverage.ts';
import {
  ensureCalibrationFont,
  getCalibrationFont,
  readCalibrationFontManifest,
} from './fonts/fetch-fonts.ts';
import {
  createCalibrationMeasurementConfig,
  resolveBaselineY,
  type CalibrationMeasurementConfig,
} from './measurement-config.ts';
import {
  measureCalibrationSample,
  type CalibrationSampleMeasurement,
} from './measure-sample.ts';
import type { FontCoverageResult } from './fonts/coverage.ts';

export type CalibrationSampleSummaryInput = {
  font: {
    id: string;
    family: string;
    version: string;
    sha256: string;
  };
  coverage: FontCoverageResult;
  measurement: CalibrationSampleMeasurement;
  config: CalibrationMeasurementConfig;
};

export type CalibrationSampleSummary = {
  schemaVersion: 'ids-composit-calibration-sample/v0.2';
  sample: {
    ids: string;
    character: string;
    operator?: string;
    slots: CalibrationSampleMeasurement['calibration']['slots'];
  };
  font: CalibrationSampleSummaryInput['font'] & {
    metrics: FontCoverageResult['metrics'];
  };
  coverage: FontCoverageResult;
  geometry: {
    canvasWidthPx: number;
    canvasHeightPx: number;
    rootX: number;
    rootY: number;
    rootWidth: number;
    rootHeight: number;
    fontSizePx: number;
    baselineY: number;
  };
  loss: CalibrationSampleMeasurement['lossBreakdown'];
};

export function buildCalibrationSampleSummary(input: CalibrationSampleSummaryInput): CalibrationSampleSummary {
  const parsed = parseIds(input.measurement.calibration.ids);
  return {
    schemaVersion: 'ids-composit-calibration-sample/v0.2',
    sample: {
      ids: input.measurement.calibration.ids,
      character: input.measurement.calibration.character,
      ...(parsed.ok && parsed.ast.type === 'composition' ? { operator: parsed.ast.operator } : {}),
      slots: input.measurement.calibration.slots,
    },
    font: {
      ...input.font,
      metrics: input.coverage.metrics,
    },
    coverage: input.coverage,
    geometry: {
      canvasWidthPx: input.config.canvasWidthPx,
      canvasHeightPx: input.config.canvasHeightPx,
      rootX: input.config.rootX,
      rootY: input.config.rootY,
      rootWidth: input.config.rootWidth,
      rootHeight: input.config.rootHeight,
      fontSizePx: input.config.fontSizePx,
      baselineY: resolveBaselineY(input.config, input.coverage.metrics),
    },
    loss: input.measurement.lossBreakdown,
  };
}

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run calibration:measure:sample -- [--font FONT_ID] [--ids IDS] [--character CHAR] [--output FILE]');
    return;
  }
  const fontId = argumentValue(args, '--font') ?? 'source-han-sans-jp-regular';
  const ids = argumentValue(args, '--ids') ?? '⿰木可';
  const character = argumentValue(args, '--character') ?? '柯';
  const manifest = await readCalibrationFontManifest();
  const font = getCalibrationFont(manifest, fontId);
  const fontPath = await ensureCalibrationFont(font);
  registerCalibrationFont(fontPath, font.family);
  const coverage = checkFontCoverage(fontPath, character, ids);
  if (!coverage.rasterEligible) {
    throw new Error(`Calibration sample is not raster-eligible; missing code points: ${coverage.missingCodePoints.join(', ') || 'invalid IDS'}`);
  }
  const config = createCalibrationMeasurementConfig({ fontId: font.id, fontFamily: font.family });
  const measurement = measureCalibrationSample(
    { ids, character, font: font.family },
    () => createCalibrationCanvas(config.canvasWidthPx, config.canvasHeightPx),
    config,
    {},
    { fontMetrics: coverage.metrics },
  );
  const summary = buildCalibrationSampleSummary({
    font: { id: font.id, family: font.family, version: font.version, sha256: font.expectedSha256 },
    coverage,
    measurement,
    config,
  });
  const output = argumentValue(args, '--output')
    ?? resolve('.artifacts/calibration', `sample-${font.id}.json`);
  await mkdir(dirname(resolve(output)), { recursive: true });
  await writeFile(resolve(output), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(`Measured ${ids} → ${character} with ${font.id}`);
  console.log(`Summary: ${output}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
