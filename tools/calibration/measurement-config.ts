export type CalibrationMeasurementConfig = {
  /** Manifest id of the explicit font binary used for the measurement. */
  fontId: string;
  /** Registered font family used for both native and composed draws. */
  fontFamily: string;
  /** The fixed em/font size in physical canvas pixels. */
  fontSizePx: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  /** Root em box in physical canvas coordinates. */
  rootX: number;
  rootY: number;
  rootWidth: number;
  rootHeight: number;
  /** Default alpha threshold for later ink metric evaluation. */
  alphaThreshold: number;
};

export type CalibrationFontMetrics = {
  unitsPerEm: number;
  ascent: number;
  descent: number;
};

/**
 * Only a deterministic test/fake-backend fallback. Real evidence must pass
 * metrics read from the selected font by fontkit.
 */
export const DEFAULT_CALIBRATION_FONT_METRICS: Readonly<CalibrationFontMetrics> = Object.freeze({
  unitsPerEm: 1000,
  ascent: 880,
  descent: -120,
});

export const DEFAULT_CALIBRATION_MEASUREMENT_CONFIG: Readonly<CalibrationMeasurementConfig> = Object.freeze({
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

export function validateCalibrationMeasurementConfig(config: CalibrationMeasurementConfig): void {
  if (config.fontId.trim().length === 0) throw new RangeError('Calibration fontId must not be empty');
  if (config.fontFamily.trim().length === 0) throw new RangeError('Calibration fontFamily must not be empty');
  if (!Number.isFinite(config.fontSizePx) || config.fontSizePx <= 0) {
    throw new RangeError('Calibration fontSizePx must be positive and finite');
  }
  if (!Number.isInteger(config.canvasWidthPx) || config.canvasWidthPx <= 0
    || !Number.isInteger(config.canvasHeightPx) || config.canvasHeightPx <= 0) {
    throw new RangeError('Calibration canvas dimensions must be positive integers');
  }
  if (![config.rootX, config.rootY, config.rootWidth, config.rootHeight].every(Number.isFinite)
    || config.rootX < 0 || config.rootY < 0 || config.rootWidth <= 0 || config.rootHeight <= 0
    || config.rootX + config.rootWidth > config.canvasWidthPx
    || config.rootY + config.rootHeight > config.canvasHeightPx) {
    throw new RangeError('Calibration root em box must be positive and inside the canvas');
  }
  if (!Number.isFinite(config.alphaThreshold) || config.alphaThreshold < 0 || config.alphaThreshold > 1) {
    throw new RangeError('Calibration alphaThreshold must be between 0 and 1');
  }
}

export function resolveBaselineY(
  config: CalibrationMeasurementConfig,
  metrics: CalibrationFontMetrics = DEFAULT_CALIBRATION_FONT_METRICS,
): number {
  validateCalibrationMeasurementConfig(config);
  if (!Number.isFinite(metrics.unitsPerEm) || metrics.unitsPerEm <= 0
    || !Number.isFinite(metrics.ascent) || !Number.isFinite(metrics.descent)) {
    throw new RangeError('Calibration font metrics must be finite and unitsPerEm must be positive');
  }
  return config.rootY + config.fontSizePx * metrics.ascent / metrics.unitsPerEm;
}

export function createCalibrationMeasurementConfig(
  overrides: Partial<CalibrationMeasurementConfig> = {},
): CalibrationMeasurementConfig {
  const config = { ...DEFAULT_CALIBRATION_MEASUREMENT_CONFIG, ...overrides };
  validateCalibrationMeasurementConfig(config);
  return config;
}
