import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  createCalibrationMeasurementConfig,
  validateCalibrationMeasurementConfig,
} from '../../tools/calibration/measurement-config';

describe('calibration measurement config', () => {
  it('provides one explicit font, em, canvas, and baseline condition', () => {
    expect(DEFAULT_CALIBRATION_MEASUREMENT_CONFIG).toEqual({
      fontFamily: 'serif',
      fontSizePx: 64,
      canvasWidthPx: 64,
      canvasHeightPx: 64,
      baselinePx: 52,
      alphaThreshold: 0.01,
    });
    expect(() => validateCalibrationMeasurementConfig(DEFAULT_CALIBRATION_MEASUREMENT_CONFIG)).not.toThrow();
  });

  it('allows explicit overrides but rejects invalid measurement conditions', () => {
    expect(createCalibrationMeasurementConfig({ fontFamily: 'sans-serif', baselinePx: 48 })).toMatchObject({
      fontFamily: 'sans-serif',
      fontSizePx: 64,
      baselinePx: 48,
    });
    expect(() => validateCalibrationMeasurementConfig({
      ...DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
      baselinePx: 65,
    })).toThrow(/baseline/i);
    expect(() => validateCalibrationMeasurementConfig({
      ...DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
      alphaThreshold: 1.1,
    })).toThrow(/alpha/i);
  });
});
