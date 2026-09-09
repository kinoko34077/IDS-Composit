export type LossSummary = {
  count: number;
  median: number;
  p75: number;
};

export type CalibrationComparison = {
  baseline: LossSummary;
  profile: LossSummary;
  accepted: boolean;
};

function percentile(values: readonly number[], position: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  if (position === 0.5 && sorted.length % 2 === 0) {
    const upper = sorted.length / 2;
    return ((sorted[upper - 1] ?? Number.NaN) + (sorted[upper] ?? Number.NaN)) / 2;
  }
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(position * sorted.length) - 1));
  return sorted[index] ?? Number.NaN;
}

export function summarizeLosses(losses: readonly number[]): LossSummary {
  return {
    count: losses.length,
    median: percentile(losses, 0.5),
    p75: percentile(losses, 0.75),
  };
}

export function compareCalibrationLosses(baseline: readonly number[], profile: readonly number[]): CalibrationComparison {
  const baselineSummary = summarizeLosses(baseline);
  const profileSummary = summarizeLosses(profile);
  return {
    baseline: baselineSummary,
    profile: profileSummary,
    accepted: profileSummary.median < baselineSummary.median && profileSummary.p75 <= baselineSummary.p75,
  };
}
