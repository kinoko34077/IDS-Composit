import type { LayoutProfile, LayoutProfileSlot } from '../../src/calibration';

export type LayoutProfileEvidence = {
  ids: string;
  character: string;
  font: string;
  operator: string;
  slots: readonly LayoutProfileSlot[];
  loss: number;
};

export type LayoutProfileNumericDistribution = {
  mean: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sampleCount: number;
};

export type LayoutProfileSlotDistribution = {
  role: LayoutProfileSlot['role'];
  x: LayoutProfileNumericDistribution;
  y: LayoutProfileNumericDistribution;
  width: LayoutProfileNumericDistribution;
  height: LayoutProfileNumericDistribution;
};

export type LayoutProfileBuildResult = {
  profiles: Readonly<Record<string, LayoutProfile>>;
  distributions: Readonly<Record<string, readonly LayoutProfileSlotDistribution[]>>;
};

function isValidSlot(slot: LayoutProfileSlot): boolean {
  return typeof slot.role === 'string'
    && slot.role.length > 0
    && [slot.x, slot.y, slot.width, slot.height].every(Number.isFinite)
    && slot.x >= 0 && slot.y >= 0 && slot.width >= 0 && slot.height >= 0
    && slot.x + slot.width <= 1 && slot.y + slot.height <= 1;
}

function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function groupEvidence(evidence: readonly LayoutProfileEvidence[]): Map<string, LayoutProfileEvidence[]> {
  const groups = new Map<string, LayoutProfileEvidence[]>();
  for (const sample of evidence) {
    if (sample.operator.length === 0 || !Number.isFinite(sample.loss) || sample.slots.length === 0) continue;
    if (!sample.slots.every(isValidSlot)) continue;
    const signature = `${sample.operator}\u0000${sample.slots.map((slot) => slot.role).join(',')}`;
    const group = groups.get(signature) ?? [];
    group.push(sample);
    groups.set(signature, group);
  }
  return groups;
}

function percentile(values: readonly number[], position: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 0) return Number.NaN;
  if (position === 0.5 && sorted.length % 2 === 0) {
    const upper = sorted.length / 2;
    return ((sorted[upper - 1] ?? Number.NaN) + (sorted[upper] ?? Number.NaN)) / 2;
  }
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(position * sorted.length) - 1));
  return sorted[index] ?? Number.NaN;
}

function summarize(values: readonly number[]): LayoutProfileNumericDistribution {
  return {
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    p10: percentile(values, 0.10),
    p25: percentile(values, 0.25),
    p50: percentile(values, 0.50),
    p75: percentile(values, 0.75),
    p90: percentile(values, 0.90),
    sampleCount: values.length,
  };
}

function selectGroups(groups: Map<string, LayoutProfileEvidence[]>): Map<string, LayoutProfileEvidence[]> {
  const byOperator = new Map<string, Array<{ signature: string; samples: LayoutProfileEvidence[] }>>();
  for (const [signature, samples] of groups) {
    const operator = samples[0]?.operator;
    if (operator === undefined) continue;
    const operatorGroups = byOperator.get(operator) ?? [];
    operatorGroups.push({ signature, samples });
    byOperator.set(operator, operatorGroups);
  }
  const selected = new Map<string, LayoutProfileEvidence[]>();
  for (const operator of [...byOperator.keys()].sort(compareText)) {
    const operatorGroups = byOperator.get(operator) ?? [];
    operatorGroups.sort((left, right) => right.samples.length - left.samples.length || compareText(left.signature, right.signature));
    const group = operatorGroups[0];
    if (group !== undefined) selected.set(operator, group.samples);
  }
  return selected;
}

function slotDistribution(samples: readonly LayoutProfileEvidence[], slotIndex: number): LayoutProfileSlotDistribution | undefined {
  const slots = samples.map((sample) => sample.slots[slotIndex]).filter((slot): slot is LayoutProfileSlot => slot !== undefined);
  if (slots.length !== samples.length || slots[0] === undefined) return undefined;
  return {
    role: slots[0].role,
    x: summarize(slots.map((slot) => slot.x)),
    y: summarize(slots.map((slot) => slot.y)),
    width: summarize(slots.map((slot) => slot.width)),
    height: summarize(slots.map((slot) => slot.height)),
  };
}

export function buildLayoutProfileReport(
  evidence: readonly LayoutProfileEvidence[],
  corpusVersion: string,
): LayoutProfileBuildResult {
  const selectedByOperator = selectGroups(groupEvidence(evidence));
  const profiles: Record<string, LayoutProfile> = {};
  const distributions: Record<string, LayoutProfileSlotDistribution[]> = {};

  for (const operator of [...selectedByOperator.keys()].sort(compareText)) {
    const samples = selectedByOperator.get(operator) ?? [];
    const slotReports = samples[0]?.slots.map((_, slotIndex) => slotDistribution(samples, slotIndex)) ?? [];
    if (slotReports.some((slot) => slot === undefined)) continue;
    const validReports = slotReports as LayoutProfileSlotDistribution[];
    distributions[operator] = validReports;
    profiles[operator] = {
      operator,
      sampleCount: samples.length,
      corpusVersion,
      slots: validReports.map((report) => ({
        role: report.role,
        x: report.x.p50,
        y: report.y.p50,
        width: report.width.p50,
        height: report.height.p50,
      })),
    };
  }

  return { profiles, distributions };
}

export function buildLayoutProfiles(
  evidence: readonly LayoutProfileEvidence[],
  corpusVersion: string,
): Readonly<Record<string, LayoutProfile>> {
  return buildLayoutProfileReport(evidence, corpusVersion).profiles;
}
