import { describe, expect, it } from 'vitest';
import { optimizeSlots } from '../../tools/calibration/optimizer';

describe('calibration slot optimizer', () => {
  it('reduces a pure placement loss with deterministic coordinate search', () => {
    const initial = [{ x: 0.5, y: 0.5, width: 0.5, height: 0.5 }];
    const result = optimizeSlots(
      initial,
      (slots) => {
        const slot = slots[0];
        if (slot === undefined) return Number.POSITIVE_INFINITY;
        return Math.abs(slot.x - 0.6) + Math.abs(slot.width - 0.4);
      },
      { steps: [-0.2, -0.1, 0, 0.1, 0.2], maxPasses: 4 },
    );

    expect(result.loss).toBeLessThan(0.001);
    expect(result.slots[0]?.x).toBeCloseTo(0.6);
    expect(result.slots[0]?.width).toBeCloseTo(0.4);
    expect(result.evaluations).toBeGreaterThan(1);
  });

  it('keeps optimized boxes inside the normalized root box', () => {
    const result = optimizeSlots(
      [{ x: 0.9, y: 0.9, width: 0.1, height: 0.1 }],
      (slots) => -(slots[0]?.x ?? 0) - (slots[0]?.y ?? 0),
      { steps: [0, 0.5], maxPasses: 1 },
    );

    expect(result.slots[0]).toEqual({ x: 0.9, y: 0.9, width: 0.1, height: 0.1 });
  });

  it('uses the fixed three-stage ±0.04/0.02/0.01 schedule by default', () => {
    const result = optimizeSlots(
      [{ x: 0.5, y: 0.5, width: 0.4, height: 0.5 }],
      (slots) => Math.abs((slots[0]?.x ?? 0) - 0.54),
    );

    expect(result.slots[0]?.x).toBeCloseTo(0.54);
    expect(result.stageEvaluations).toHaveLength(3);
    expect(result.stageSteps).toEqual([0.04, 0.02, 0.01]);
  });

  it('allows overlap while preserving a minimum slot size', () => {
    const result = optimizeSlots(
      [
        { x: 0, y: 0, width: 0.2, height: 0.2 },
        { x: 0.2, y: 0, width: 0.2, height: 0.2 },
      ],
      (slots) => Math.abs((slots[0]?.width ?? 0) - 0.1) + Math.abs((slots[1]?.x ?? 0) - 0.1),
      { stages: [0.04], maxPasses: 3 },
    );

    expect(result.slots[0]?.width).toBeGreaterThanOrEqual(0.1);
    expect(result.slots[1]?.x).toBeLessThan(0.2);
    expect(result.slots[0]?.x).toBeGreaterThanOrEqual(0);
    expect(result.slots[1]?.x! + result.slots[1]?.width!).toBeLessThanOrEqual(1);
  });
});
