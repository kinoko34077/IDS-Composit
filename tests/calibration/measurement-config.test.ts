import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  resolveBaselineY,
  createCalibrationMeasurementConfig,
  validateCalibrationMeasurementConfig,
} from '../../tools/calibration/measurement-config';

describe('calibration measurement config', () => {
  it('provides one explicit font, em, canvas, and root em condition', () => {
    expect(DEFAULT_CALIBRATION_MEASUREMENT_CONFIG).toEqual({
      fontId: 'source-han-sans-jp-regular',
      fontFamily: 'Source Han Sans JP',
      fontSizePx: 128,
      canvasWidthPx: 160,
      canvasHeightPx: 160,
      rootX: 16,
      rootY: 16,
      rootWidth: 128,
      rootHeight: 128,
      alphaThreshold: 0.01,
    });
    expect(() => validateCalibrationMeasurementConfig(DEFAULT_CALIBRATION_MEASUREMENT_CONFIG)).not.toThrow();
  });

  it('allows explicit overrides but rejects invalid measurement conditions', () => {
    expect(createCalibrationMeasurementConfig({ fontFamily: 'Test Font', rootX: 12 })).toMatchObject({
      fontFamily: 'Test Font',
      fontSizePx: 128,
      rootX: 12,
    });
    expect(() => validateCalibrationMeasurementConfig({
      ...DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
      rootX: 40,
      rootWidth: 128,
    })).toThrow(/root/i);
    expect(() => validateCalibrationMeasurementConfig({
      ...DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
      alphaThreshold: 1.1,
    })).toThrow(/alpha/i);
  });

  it('derives baseline from font metrics instead of a fixed pixel constant', () => {
    expect(resolveBaselineY(DEFAULT_CALIBRATION_MEASUREMENT_CONFIG, {
      unitsPerEm: 1000,
      ascent: 880,
      descent: -120,
    })).toBe(128.64);
  });
});
