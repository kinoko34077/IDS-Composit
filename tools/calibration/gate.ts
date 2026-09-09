import {
  summarizeLosses,
  type LossSummary,
} from './report.ts';

export type OperatorGateStatus = 'accept' | 'reject' | 'insufficient-samples';

export type OperatorGateReason =
  | 'passed'
  | 'insufficient-samples'
  | 'missing-measurements'
  | 'sans-regression'
  | 'serif-regression';

export type OperatorGateInput = {
  trainCount: number;
  holdoutCount: number;
  baselineSans: readonly number[];
  candidateSans: readonly number[];
  baselineSerif: readonly number[];
  candidateSerif: readonly number[];
  minTrain?: number;
  minHoldout?: number;
};

export type FontGateComparison = {
  baseline: LossSummary;
  candidate: LossSummary;
  medianImproved: boolean;
  p75NotWorse: boolean;
};

export type OperatorGateResult = {
  status: OperatorGateStatus;
  reason: OperatorGateReason;
  trainCount: number;
  holdoutCount: number;
  sans: FontGateComparison;
  serif: FontGateComparison;
};

function compareFont(
  baselineLosses: readonly number[],
  candidateLosses: readonly number[],
  requireMedianImprovement: boolean,
): FontGateComparison {
  const baseline = summarizeLosses(baselineLosses);
  const candidate = summarizeLosses(candidateLosses);
  return {
    baseline,
    candidate,
    medianImproved: requireMedianImprovement
      ? candidate.median < baseline.median
      : candidate.median <= baseline.median,
    p75NotWorse: candidate.p75 <= baseline.p75,
  };
}

export function evaluateOperatorGate(input: OperatorGateInput): OperatorGateResult {
  const minTrain = Math.max(1, Math.floor(input.minTrain ?? 80));
  const minHoldout = Math.max(1, Math.floor(input.minHoldout ?? 20));
  const sans = compareFont(input.baselineSans, input.candidateSans, true);
  const serif = compareFont(input.baselineSerif, input.candidateSerif, false);
  const resultBase = {
    trainCount: input.trainCount,
    holdoutCount: input.holdoutCount,
    sans,
    serif,
  };

  if (input.trainCount < minTrain || input.holdoutCount < minHoldout) {
    return { ...resultBase, status: 'insufficient-samples', reason: 'insufficient-samples' };
  }
  const measurementSets = [
    input.baselineSans,
    input.candidateSans,
    input.baselineSerif,
    input.candidateSerif,
  ];
  if (measurementSets.some((losses) => losses.length === 0 || losses.some((loss) => !Number.isFinite(loss)))) {
    return { ...resultBase, status: 'reject', reason: 'missing-measurements' };
  }
  if (!sans.medianImproved || !sans.p75NotWorse) {
    return { ...resultBase, status: 'reject', reason: 'sans-regression' };
  }
  if (!serif.medianImproved || !serif.p75NotWorse) {
    return { ...resultBase, status: 'reject', reason: 'serif-regression' };
  }
  return { ...resultBase, status: 'accept', reason: 'passed' };
}
