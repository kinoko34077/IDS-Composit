import { describe, expect, it } from 'vitest';
import { calculateCalibrationLoss, type RootEmBox } from '../../tools/calibration/loss-v1';
import type { AlphaMask } from '../../src/calibration/types';

const root: RootEmBox = { x: 1, y: 1, width: 4, height: 4 };

function mask(rows: readonly string[]): AlphaMask {
  const data = rows.flatMap((row) => [...row].map((value) => value === '#' ? 1 : 0));
  return { width: rows[0]?.length ?? 0, height: rows.length, data };
}

describe('Calibration Loss v1', () => {
  it('returns zero for identical root-em ink and ignores padding', () => {
    const native = mask([
      '......',
      '.##...',
      '.##...',
      '......',
      '......',
      '......',
    ]);
    expect(calculateCalibrationLoss(native, native, root)).toEqual({
      axisOccupancy: 0,
      inkBounds: 0,
      centroid: 0,
      occupiedArea: 0,
      alphaMask: 0,
      total: 0,
    });
  });

  it('reports all weighted sub-losses for translated ink', () => {
    const native = mask([
      '......',
      '.##...',
      '.##...',
      '......',
      '......',
      '......',
    ]);
    const composed = mask([
      '......',
      '...##.',
      '...##.',
      '......',
      '......',
      '......',
    ]);
    const result = calculateCalibrationLoss(native, composed, root);

    expect(result.axisOccupancy).toBeGreaterThan(0);
    expect(result.inkBounds).toBeGreaterThan(0);
    expect(result.centroid).toBeGreaterThan(0);
    expect(result.occupiedArea).toBe(0);
    expect(result.alphaMask).toBeGreaterThan(0);
    expect(result.total).toBeCloseTo(
      result.axisOccupancy * 0.4
      + result.inkBounds * 0.25
      + result.centroid * 0.15
      + result.occupiedArea * 0.1
      + result.alphaMask * 0.1,
    );
    expect(result.total).toBeLessThanOrEqual(1);
  });

  it('handles an empty composition as maximally different only where ink is absent', () => {
    const native = mask([
      '......',
      '.##...',
      '.##...',
      '......',
      '......',
      '......',
    ]);
    const empty = mask(['......', '......', '......', '......', '......', '......']);
    const result = calculateCalibrationLoss(native, empty, root);

    expect(result.axisOccupancy).toBe(1);
    expect(result.inkBounds).toBe(1);
    expect(result.centroid).toBe(1);
    expect(result.occupiedArea).toBe(0.25);
    expect(result.alphaMask).toBe(0.25);
  });
});
