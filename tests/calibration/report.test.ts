import { describe, expect, it } from 'vitest';
import { compareCalibrationLosses, summarizeLosses } from '../../tools/calibration/report';

describe('calibration report', () => {
  it('summarizes median and p75 deterministically', () => {
    expect(summarizeLosses([0.4, 0.1, 0.3, 0.2])).toEqual({ count: 4, median: 0.2, p75: 0.3 });
  });

  it('accepts a profile only when median improves and p75 does not regress', () => {
    expect(compareCalibrationLosses([0.4, 0.5, 0.6, 0.7], [0.2, 0.3, 0.6, 0.7]).accepted).toBe(true);
    expect(compareCalibrationLosses([0.4, 0.5, 0.6, 0.7], [0.2, 0.3, 0.8, 0.9]).accepted).toBe(false);
  });
});
