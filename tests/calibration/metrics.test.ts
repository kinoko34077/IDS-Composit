import { describe, expect, it } from 'vitest';
import {
  alphaMaskSimilarity,
  measureCentroid,
  measureInkBounds,
  measureOccupiedArea,
} from '../../src/calibration/metrics';

const mask = {
  width: 3,
  height: 2,
  data: [1, 0, 0, 0, 1, 0],
} as const;

describe('calibration metrics', () => {
  it('measures ink bounds, occupied area, and weighted centroid', () => {
    expect(measureInkBounds(mask)).toEqual({ x: 0, y: 0, width: 2, height: 2 });
    expect(measureOccupiedArea(mask)).toBe(2 / 6);
    expect(measureCentroid(mask)).toEqual({ x: 1, y: 1 });
  });

  it('provides a replaceable alpha-mask similarity metric', () => {
    expect(alphaMaskSimilarity(mask, mask)).toBe(1);
    expect(alphaMaskSimilarity(mask, { ...mask, data: [0, 0, 0, 0, 1, 0] })).toBeCloseTo(5 / 6);
  });
});
