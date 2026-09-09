import type { LayoutProfile, LayoutProfileSlot } from '../../src/calibration';

export type LayoutProfileEvidence = {
  ids: string;
  character: string;
  font: string;
  operator: string;
  slots: readonly LayoutProfileSlot[];
  loss: number;
};

function isValidSlot(slot: LayoutProfileSlot): boolean {
  return typeof slot.role === 'string'
    && slot.role.length > 0
    && [slot.x, slot.y, slot.width, slot.height].every(Number.isFinite)
    && slot.x >= 0 && slot.y >= 0 && slot.width >= 0 && slot.height >= 0
    && slot.x + slot.width <= 1 && slot.y + slot.height <= 1;
}

function average(slots: readonly LayoutProfileSlot[]): LayoutProfileSlot {
  const count = slots.length;
  const first = slots[0];
  if (first === undefined) throw new Error('Cannot average empty profile slots');
  return {
    role: first.role,
    x: slots.reduce((sum, slot) => sum + slot.x, 0) / count,
    y: slots.reduce((sum, slot) => sum + slot.y, 0) / count,
    width: slots.reduce((sum, slot) => sum + slot.width, 0) / count,
    height: slots.reduce((sum, slot) => sum + slot.height, 0) / count,
  };
}

export function buildLayoutProfiles(
  evidence: readonly LayoutProfileEvidence[],
  corpusVersion: string,
): Readonly<Record<string, LayoutProfile>> {
  const groups = new Map<string, LayoutProfileEvidence[]>();

  for (const sample of evidence) {
    if (sample.operator.length === 0 || !Number.isFinite(sample.loss) || sample.slots.length === 0) continue;
    if (!sample.slots.every(isValidSlot)) continue;
    const signature = `${sample.operator}\u0000${sample.slots.map((slot) => slot.role).join(',')}`;
    const group = groups.get(signature) ?? [];
    group.push(sample);
    groups.set(signature, group);
  }

  const byOperator = new Map<string, Array<{ signature: string; samples: LayoutProfileEvidence[] }>>();
  for (const [signature, samples] of groups) {
    const operator = samples[0]?.operator;
    if (operator === undefined) continue;
    const operatorGroups = byOperator.get(operator) ?? [];
    operatorGroups.push({ signature, samples });
    byOperator.set(operator, operatorGroups);
  }

  const profiles: Record<string, LayoutProfile> = {};
  for (const operator of [...byOperator.keys()].sort()) {
    const operatorGroups = byOperator.get(operator) ?? [];
    operatorGroups.sort((left, right) => right.samples.length - left.samples.length || left.signature.localeCompare(right.signature));
    const selected = operatorGroups[0];
    if (selected === undefined) continue;
    const slotCount = selected.samples[0]?.slots.length ?? 0;
    const slots: LayoutProfileSlot[] = [];
    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      const roleSlots = selected.samples
        .map((sample) => sample.slots[slotIndex])
        .filter((slot): slot is LayoutProfileSlot => slot !== undefined);
      if (roleSlots.length !== selected.samples.length) {
        slots.length = 0;
        break;
      }
      slots.push(average(roleSlots));
    }
    if (slots.length === slotCount) {
      profiles[operator] = {
        operator,
        slots,
        sampleCount: selected.samples.length,
        corpusVersion,
      };
    }
  }

  return profiles;
}
