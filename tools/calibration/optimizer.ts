import type { Box } from '../../src/core/types';

export type SlotLoss = (slots: readonly Box[]) => number;

export type OptimizeSlotsOptions = {
  /** Legacy/custom deltas for one-stage searches. */
  steps?: readonly number[];
  /** Multi-resolution absolute deltas, normally [0.04, 0.02, 0.01]. */
  stages?: readonly number[];
  maxPasses?: number;
  minSize?: number;
};

export type SlotOptimizationResult = {
  slots: Box[];
  loss: number;
  evaluations: number;
  stageSteps: number[];
  stageEvaluations: number[];
};

type Axis = keyof Box;

const AXES: readonly Axis[] = ['x', 'y', 'width', 'height'];
export const DEFAULT_OPTIMIZATION_STAGES = [0.04, 0.02, 0.01] as const;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function validateBox(box: Box, minSize: number): void {
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite)
    || box.x < 0 || box.y < 0 || box.width < minSize || box.height < minSize
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
  const minSize = clamp(options.minSize ?? 0.10, 0, 1);
  const customSteps = options.steps;
  const stageSteps = customSteps === undefined
    ? [...(options.stages ?? DEFAULT_OPTIMIZATION_STAGES)]
    : [...customSteps];
  if (stageSteps.length === 0) throw new RangeError('Calibration optimizer requires at least one step');
  if (!stageSteps.every((step) => Number.isFinite(step))) throw new RangeError('Calibration optimizer steps must be finite');
  const maxPasses = Math.max(1, Math.floor(options.maxPasses ?? (customSteps === undefined ? 3 : 4)));

  let bestSlots = initialSlots.map((slot) => {
    validateBox(slot, minSize);
    return { ...slot };
  });
  let bestLoss = loss(bestSlots);
  if (!Number.isFinite(bestLoss)) throw new RangeError('Calibration loss must be finite');
  let evaluations = 1;

  const stageEvaluations: number[] = [];
  for (const configuredStep of stageSteps) {
    const deltas = customSteps === undefined
      ? [-Math.abs(configuredStep), 0, Math.abs(configuredStep)]
      : [configuredStep];
    const startEvaluations = evaluations;
    const stagePassLimit = customSteps === undefined ? Math.min(3, maxPasses) : maxPasses;
    for (let pass = 0; pass < stagePassLimit; pass += 1) {
      let improved = false;
      for (let slotIndex = 0; slotIndex < bestSlots.length; slotIndex += 1) {
        for (const axis of AXES) {
          for (const step of deltas) {
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
    stageEvaluations.push(evaluations - startEvaluations);
  }

  return { slots: bestSlots, loss: bestLoss, evaluations, stageSteps, stageEvaluations };
}

export function optimizeSlotsMultiResolution(
  initialSlots: readonly Box[],
  loss: SlotLoss,
  options: Omit<OptimizeSlotsOptions, 'steps'> = {},
): SlotOptimizationResult {
  return optimizeSlots(initialSlots, loss, {
    ...options,
    stages: options.stages ?? DEFAULT_OPTIMIZATION_STAGES,
  });
}
