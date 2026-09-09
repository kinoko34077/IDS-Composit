import { openSync, type Font } from 'fontkit';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Box } from '../../src/core/types.ts';
import { getChildRoles } from '../../src/composition/roles.ts';
import type { LayoutProfile, LayoutProfileSlot } from '../../src/calibration/types.ts';
import type { AlphaMask } from '../../src/calibration/types.ts';
import { checkFontCoverage, type FontCoverageResult, type FontkitFontLike } from './fonts/coverage.ts';
import type { CalibrationCanvasFactory } from './measure-sample.ts';
import { measureCalibrationSample } from './measure-sample.ts';
import { calculateCalibrationLoss, type CalibrationLossBreakdown, type RootEmBox } from './loss-v1.ts';
import {
  DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  resolveBaselineY,
  type CalibrationFontMetrics,
  type CalibrationMeasurementConfig,
} from './measurement-config.ts';
import {
  rasterizeComposedIds,
  type CalibrationCanvas,
} from './rasterize.ts';
import { buildLayoutProfileReport, type LayoutProfileBuildResult, type LayoutProfileEvidence } from './profile.ts';
import { optimizeSlots, type OptimizeSlotsOptions, type SlotOptimizationResult } from './optimizer.ts';
import { evaluateOperatorGate, type OperatorGateResult } from './gate.ts';
import type { CalibrationCorpusSample } from './generate-source-corpus.ts';
import { limitPrimaryTrainingSamples, type CalibrationSourceCorpus } from './generate-source-corpus.ts';
import {
  ensureCalibrationFont,
  getCalibrationFont,
  readCalibrationFontManifest,
} from './fonts/fetch-fonts.ts';
import { createCalibrationCanvas, registerCalibrationFont } from './fonts/canvas-backend.ts';

export type OperatorCalibrationFont = {
  id: string;
  family: string;
  version: string;
  sha256: string;
  metrics: CalibrationFontMetrics;
  fontPath: string;
  fontkitFont: FontkitFontLike;
  createCanvas: CalibrationCanvasFactory;
};

export type OperatorCalibrationOptions = {
  operator: string;
  sans: OperatorCalibrationFont;
  serif: OperatorCalibrationFont;
  config?: CalibrationMeasurementConfig;
  optimizer?: OptimizeSlotsOptions;
  maxTrainingSamples?: number;
  minTrain?: number;
  minHoldout?: number;
};

export type CalibrationCoverageStats = {
  knownEligible: number;
  fontSupported: number;
  rasterEligible: number;
  missing: number;
};

export type OperatorCalibrationFontSummary = {
  id: string;
  family: string;
  version: string;
  sha256: string;
  metrics: CalibrationFontMetrics;
  coverage: {
    train: CalibrationCoverageStats;
    holdout: CalibrationCoverageStats;
  };
};

export type OperatorCalibrationSummary = {
  schemaVersion: 'ids-composit-operator-calibration-summary/v0.2';
  operator: string;
  training: {
    corpusSamples: number;
    selectedSamples: number;
    measuredSamples: number;
    optimizedSamples: number;
    evaluations: number;
  };
  holdout: {
    corpusSamples: number;
    commonRasterEligibleSamples: number;
    measuredSamples: number;
  };
  fonts: {
    sans: OperatorCalibrationFontSummary;
    serif: OperatorCalibrationFontSummary;
  };
  geometry: {
    canvasWidthPx: number;
    canvasHeightPx: number;
    rootX: number;
    rootY: number;
    rootWidth: number;
    rootHeight: number;
    fontSizePx: number;
    sansBaselineY: number;
    serifBaselineY: number;
  };
  gate: OperatorGateResult;
  profile: LayoutProfile | null;
  profileDistributions: LayoutProfileBuildResult['distributions'][string] | null;
};

export type OperatorCalibrationResult = {
  summary: OperatorCalibrationSummary;
  profileReport: LayoutProfileBuildResult;
};

export type OperatorCalibrationArtifact = Omit<OperatorCalibrationSummary, 'schemaVersion'> & {
  schemaVersion: 'ids-composit-operator-calibration-report/v0.2';
  sourceCorpusSha256: `sha256:${string}`;
};

/**
 * Create the small tracked report from a full in-memory measurement summary.
 * Per-character evidence remains in ignored raw output; the tracked report
 * keeps aggregate coordinate distributions alongside gate metrics and the
 * accepted generic profile.
 */
export function buildOperatorCalibrationArtifact(
  summary: OperatorCalibrationSummary,
  sourceCorpusSha256: `sha256:${string}`,
): OperatorCalibrationArtifact {
  const { schemaVersion: _summarySchemaVersion, ...compactSummary } = summary;
  return {
    schemaVersion: 'ids-composit-operator-calibration-report/v0.2',
    sourceCorpusSha256,
    ...compactSummary,
  };
}

type MeasuredComposition = {
  slots: Box[];
  loss: number;
  breakdown: CalibrationLossBreakdown;
};

function emptyCoverageStats(): CalibrationCoverageStats {
  return { knownEligible: 0, fontSupported: 0, rasterEligible: 0, missing: 0 };
}

function addCoverage(stats: CalibrationCoverageStats, coverage: FontCoverageResult): void {
  if (coverage.knownEligible) stats.knownEligible += 1;
  if (coverage.fontSupported) stats.fontSupported += 1;
  if (coverage.rasterEligible) stats.rasterEligible += 1;
  if (!coverage.rasterEligible) stats.missing += 1;
}

function inputFor(sample: CalibrationCorpusSample, font: OperatorCalibrationFont): { ids: string; character: string; font: string } {
  return { ids: sample.ids, character: sample.character, font: font.family };
}

function rootBox(config: CalibrationMeasurementConfig): RootEmBox {
  return {
    x: config.rootX,
    y: config.rootY,
    width: config.rootWidth,
    height: config.rootHeight,
  };
}

function evaluateSlots(
  sample: CalibrationCorpusSample,
  font: OperatorCalibrationFont,
  config: CalibrationMeasurementConfig,
  native: AlphaMask,
  slots: readonly Box[],
): MeasuredComposition {
  const composed = rasterizeComposedIds(
    font.createCanvas(),
    sample.ids,
    config,
    {},
    { fontMetrics: font.metrics, rootSlots: slots },
  );
  const breakdown = calculateCalibrationLoss(native, composed, rootBox(config));
  return { slots: slots.map((slot) => ({ ...slot })), loss: breakdown.total, breakdown };
}

function profileSlotsForOperator(profile: LayoutProfile | undefined): Box[] | undefined {
  return profile?.slots.map(({ x, y, width, height }) => ({ x, y, width, height }));
}

function withRoles(operator: string, slots: readonly Box[]): LayoutProfileSlot[] {
  const roles = getChildRoles(operator);
  if (roles.length !== slots.length) throw new RangeError(`Calibration slot count does not match ${operator}`);
  return slots.map((slot, index) => {
    const role = roles[index];
    if (role === undefined) throw new RangeError(`Calibration role is missing for ${operator}`);
    return { ...slot, role };
  });
}

function createConfig(font: OperatorCalibrationFont, config: CalibrationMeasurementConfig | undefined): CalibrationMeasurementConfig {
  return {
    ...(config ?? DEFAULT_CALIBRATION_MEASUREMENT_CONFIG),
    fontId: font.id,
    fontFamily: font.family,
  };
}

function measureBaseline(
  sample: CalibrationCorpusSample,
  font: OperatorCalibrationFont,
  config: CalibrationMeasurementConfig,
): ReturnType<typeof measureCalibrationSample> {
  return measureCalibrationSample(
    inputFor(sample, font),
    font.createCanvas,
    config,
    {},
    { fontMetrics: font.metrics },
  );
}

function coverageFor(sample: CalibrationCorpusSample, font: OperatorCalibrationFont): FontCoverageResult {
  return checkFontCoverage(font.fontPath, sample.character, sample.ids, {
    openFont: () => font.fontkitFont,
  });
}

function optimizeSample(
  sample: CalibrationCorpusSample,
  font: OperatorCalibrationFont,
  config: CalibrationMeasurementConfig,
  optimizer: OptimizeSlotsOptions,
): { baseline: ReturnType<typeof measureCalibrationSample>; optimized: MeasuredComposition; optimization: SlotOptimizationResult } {
  const baseline = measureBaseline(sample, font, config);
  const optimization = optimizeSlots(
    baseline.calibration.slots,
    (slots) => evaluateSlots(sample, font, config, baseline.native, slots).loss,
    optimizer,
  );
  return {
    baseline,
    optimized: evaluateSlots(sample, font, config, baseline.native, optimization.slots),
    optimization,
  };
}

function makeFontSummary(
  font: OperatorCalibrationFont,
  train: CalibrationCoverageStats,
  holdout: CalibrationCoverageStats,
): OperatorCalibrationFontSummary {
  return {
    id: font.id,
    family: font.family,
    version: font.version,
    sha256: font.sha256,
    metrics: font.metrics,
    coverage: { train, holdout },
  };
}

export function runOperatorCalibration(
  corpus: { train: readonly CalibrationCorpusSample[]; holdout: readonly CalibrationCorpusSample[] },
  options: OperatorCalibrationOptions,
): OperatorCalibrationResult {
  const config = createConfig(options.sans, options.config);
  const serifConfig = createConfig(options.serif, options.config);
  const optimizer = options.optimizer ?? {};
  const trainingCorpus = corpus.train.filter((sample) => sample.operator === options.operator);
  const holdoutCorpus = corpus.holdout.filter((sample) => sample.operator === options.operator);
  const selectedTraining = limitPrimaryTrainingSamples(
    trainingCorpus,
    options.maxTrainingSamples ?? 2_000,
  );
  const sansTrainCoverage = emptyCoverageStats();
  const serifTrainCoverage = emptyCoverageStats();
  const sansHoldoutCoverage = emptyCoverageStats();
  const serifHoldoutCoverage = emptyCoverageStats();
  const trainingEvidence: LayoutProfileEvidence[] = [];
  let evaluations = 0;

  for (const sample of selectedTraining) {
    const sansCoverage = coverageFor(sample, options.sans);
    const serifCoverage = coverageFor(sample, options.serif);
    addCoverage(sansTrainCoverage, sansCoverage);
    addCoverage(serifTrainCoverage, serifCoverage);
    if (!sansCoverage.rasterEligible) continue;
    const measured = optimizeSample(sample, options.sans, config, optimizer);
    evaluations += measured.optimization.evaluations;
    trainingEvidence.push({
      ids: sample.ids,
      character: sample.character,
      font: options.sans.family,
      operator: options.operator,
      slots: withRoles(options.operator, measured.optimized.slots),
      loss: measured.optimized.loss,
    });
  }

  const profileReport = buildLayoutProfileReport(trainingEvidence, 'v0.2-calibration-sans-jp');
  const profile = profileReport.profiles[options.operator];
  const profileSlots = profileSlotsForOperator(profile);
  const sansHoldoutLosses: number[] = [];
  const sansHoldoutCandidateLosses: number[] = [];
  const serifHoldoutLosses: number[] = [];
  const serifHoldoutCandidateLosses: number[] = [];
  let commonRasterEligibleSamples = 0;

  for (const sample of holdoutCorpus) {
    const sansCoverage = coverageFor(sample, options.sans);
    const serifCoverage = coverageFor(sample, options.serif);
    addCoverage(sansHoldoutCoverage, sansCoverage);
    addCoverage(serifHoldoutCoverage, serifCoverage);
    if (!sansCoverage.rasterEligible || !serifCoverage.rasterEligible || profileSlots === undefined) continue;
    const sansBaseline = measureBaseline(sample, options.sans, config);
    const sansCandidate = evaluateSlots(sample, options.sans, config, sansBaseline.native, profileSlots);
    const serifBaseline = measureBaseline(sample, options.serif, serifConfig);
    const serifCandidate = evaluateSlots(sample, options.serif, serifConfig, serifBaseline.native, profileSlots);
    sansHoldoutLosses.push(sansBaseline.lossBreakdown.total);
    sansHoldoutCandidateLosses.push(sansCandidate.loss);
    serifHoldoutLosses.push(serifBaseline.lossBreakdown.total);
    serifHoldoutCandidateLosses.push(serifCandidate.loss);
    commonRasterEligibleSamples += 1;
  }

  const gate = evaluateOperatorGate({
    trainCount: trainingEvidence.length,
    holdoutCount: commonRasterEligibleSamples,
    baselineSans: sansHoldoutLosses,
    candidateSans: sansHoldoutCandidateLosses,
    baselineSerif: serifHoldoutLosses,
    candidateSerif: serifHoldoutCandidateLosses,
    minTrain: options.minTrain,
    minHoldout: options.minHoldout,
  });
  const summary: OperatorCalibrationSummary = {
    schemaVersion: 'ids-composit-operator-calibration-summary/v0.2',
    operator: options.operator,
    training: {
      corpusSamples: trainingCorpus.length,
      selectedSamples: selectedTraining.length,
      measuredSamples: trainingEvidence.length,
      optimizedSamples: trainingEvidence.length,
      evaluations,
    },
    holdout: {
      corpusSamples: holdoutCorpus.length,
      commonRasterEligibleSamples,
      measuredSamples: sansHoldoutLosses.length,
    },
    fonts: {
      sans: makeFontSummary(options.sans, sansTrainCoverage, sansHoldoutCoverage),
      serif: makeFontSummary(options.serif, serifTrainCoverage, serifHoldoutCoverage),
    },
    geometry: {
      canvasWidthPx: config.canvasWidthPx,
      canvasHeightPx: config.canvasHeightPx,
      rootX: config.rootX,
      rootY: config.rootY,
      rootWidth: config.rootWidth,
      rootHeight: config.rootHeight,
      fontSizePx: config.fontSizePx,
      sansBaselineY: resolveBaselineY(config, options.sans.metrics),
      serifBaselineY: resolveBaselineY(serifConfig, options.serif.metrics),
    },
    gate,
    profile: gate.status === 'accept' ? (profile ?? null) : null,
    profileDistributions: gate.status === 'accept'
      ? (profileReport.distributions[options.operator] ?? null)
      : null,
  };
  return { summary, profileReport };
}

export function openCalibrationFont(fontPath: string): Font {
  return openSync(fontPath);
}

export type { CalibrationCanvas };

function argumentValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

function assertCalibrationSourceCorpus(value: unknown): CalibrationSourceCorpus {
  if (typeof value !== 'object' || value === null) throw new Error('Calibration source corpus must be an object');
  const corpus = value as Partial<CalibrationSourceCorpus>;
  if (corpus.version !== 'v0.2-calibration-source' || corpus.region !== 'JP') {
    throw new Error('Unsupported Calibration source corpus version or region');
  }
  if (!Array.isArray(corpus.primary?.train) || !Array.isArray(corpus.primary?.holdout)) {
    throw new Error('Calibration source corpus primary train/holdout arrays are required');
  }
  return corpus as CalibrationSourceCorpus;
}

function operatorFileName(operator: string): string {
  return [...operator].map((value) => `u${value.codePointAt(0)?.toString(16) ?? 'unknown'}`).join('-');
}

async function createRuntimeFont(fontId: string, manifest: Awaited<ReturnType<typeof readCalibrationFontManifest>>): Promise<OperatorCalibrationFont> {
  const font = getCalibrationFont(manifest, fontId);
  const fontPath = await ensureCalibrationFont(font);
  registerCalibrationFont(fontPath, font.family);
  const fontkitFont = openCalibrationFont(fontPath);
  return {
    id: font.id,
    family: font.family,
    version: font.version,
    sha256: font.expectedSha256,
    fontPath,
    metrics: {
      unitsPerEm: fontkitFont.unitsPerEm,
      ascent: fontkitFont.ascent,
      descent: fontkitFont.descent,
    },
    fontkitFont,
    createCanvas: () => createCalibrationCanvas(160, 160),
  };
}

async function runCli(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  if (args.includes('--help')) {
    console.log('Usage: npm run calibration:measure:operator -- [--corpus FILE] [--operator IDC | --all] [--max-train N] [--output FILE]');
    return;
  }
  const corpusPath = argumentValue(args, '--corpus') ?? '.artifacts/calibration/calibration-source-corpus-v0.2.json';
  const output = argumentValue(args, '--output') ?? '.artifacts/calibration/operator-calibration-v0.2.json';
  const corpusText = await readFile(resolve(corpusPath), 'utf8');
  const sourceCorpusSha256 = `sha256:${createHash('sha256').update(corpusText, 'utf8').digest('hex')}` as `sha256:${string}`;
  const corpus = assertCalibrationSourceCorpus(JSON.parse(corpusText) as unknown);
  const manifest = await readCalibrationFontManifest();
  const [sans, serif] = await Promise.all([
    createRuntimeFont('source-han-sans-jp-regular', manifest),
    createRuntimeFont('source-han-serif-jp-regular', manifest),
  ]);
  const operators = args.includes('--all')
    ? [...new Set(corpus.primary.train.concat(corpus.primary.holdout).map((sample) => sample.operator))].sort()
    : [argumentValue(args, '--operator') ?? '⿰'];
  const maxTrainValue = argumentValue(args, '--max-train');
  let maxTrainingSamples: number | undefined;
  if (maxTrainValue !== undefined) {
    const parsedMaxTrainingSamples = Number.parseInt(maxTrainValue, 10);
    if (!Number.isInteger(parsedMaxTrainingSamples) || parsedMaxTrainingSamples < 1) {
      throw new RangeError('--max-train must be a positive integer');
    }
    maxTrainingSamples = parsedMaxTrainingSamples;
  }
  const summaries: Record<string, OperatorCalibrationArtifact> = {};
  for (const operator of operators) {
    const result = runOperatorCalibration({
      train: corpus.primary.train,
      holdout: corpus.primary.holdout,
    }, { operator, sans, serif, maxTrainingSamples });
    summaries[operator] = buildOperatorCalibrationArtifact(result.summary, sourceCorpusSha256);
    console.log(`${operator}: ${result.summary.gate.status} (${result.summary.gate.reason}), train=${result.summary.training.measuredSamples}, holdout=${result.summary.holdout.measuredSamples}`);
  }
  await mkdir(dirname(resolve(output)), { recursive: true });
  const report = operators.length === 1 && !args.includes('--all')
    ? summaries[operators[0] ?? '']
    : {
      schemaVersion: 'ids-composit-operator-calibration-report/v0.2',
      sourceCorpusSha256,
      summaries,
    };
  await writeFile(resolve(output), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Calibration report: ${output}`);
}

const scriptPath = process.argv[1];
if (scriptPath !== undefined && pathToFileURL(resolve(scriptPath)).href === import.meta.url) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
