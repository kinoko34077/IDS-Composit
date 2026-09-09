import type { Box } from '../../src/core/types';

export type SlotLoss = (slots: readonly Box[]) => number;

export type OptimizeSlotsOptions = {
  steps?: readonly number[];
  maxPasses?: number;
  minSize?: number;
};

export type SlotOptimizationResult = {
  slots: Box[];
  loss: number;
  evaluations: number;
};

type Axis = keyof Box;

const AXES: readonly Axis[] = ['x', 'y', 'width', 'height'];
const DEFAULT_STEPS = [-0.05, 0, 0.05] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function validateBox(box: Box): void {
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite)
    || box.x < 0 || box.y < 0 || box.width < 0 || box.height < 0
    || box.x + box.width > 1 || box.y + box.height > 1) {
    throw new RangeError('Calibration slots must be finite boxes inside the normalized root box');
  }
}

function adjustBox(box: Box, axis: Axis, delta: number, minSize: number): Box {
  if (axis === 'x') return { ...box, x: clamp(box.x + delta, 0, 1 - box.width) };
  if (axis === 'y') return { ...box, y: clamp(box.y + delta, 0, 1 - box.height) };
  if (axis === 'width') return { ...box, width: clamp(box.width + delta, minSize, 1 - box.x) };
  return { ...box, height: clamp(box.height + delta, minSize, 1 - box.y) };
}

export function optimizeSlots(
  initialSlots: readonly Box[],
  loss: SlotLoss,
  options: OptimizeSlotsOptions = {},
): SlotOptimizationResult {
  const steps = options.steps ?? DEFAULT_STEPS;
  const minSize = clamp(options.minSize ?? 0, 0, 1);
  const maxPasses = Math.max(1, Math.floor(options.maxPasses ?? 4));
  if (steps.length === 0) throw new RangeError('Calibration optimizer requires at least one step');

  let bestSlots = initialSlots.map((slot) => {
    validateBox(slot);
    return { ...slot };
  });
  let bestLoss = loss(bestSlots);
  if (!Number.isFinite(bestLoss)) throw new RangeError('Calibration loss must be finite');
  let evaluations = 1;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let improved = false;
    for (let slotIndex = 0; slotIndex < bestSlots.length; slotIndex += 1) {
      for (const axis of AXES) {
        for (const step of steps) {
          if (!Number.isFinite(step)) continue;
          const candidate = bestSlots.map((slot, index) => index === slotIndex
            ? adjustBox(slot, axis, step, minSize)
            : { ...slot });
          const candidateLoss = loss(candidate);
          evaluations += 1;
          if (Number.isFinite(candidateLoss) && candidateLoss < bestLoss) {
            bestSlots = candidate;
            bestLoss = candidateLoss;
            improved = true;
          }
        }
      }
    }
    if (!improved) break;
  }

  return { slots: bestSlots, loss: bestLoss, evaluations };
}
