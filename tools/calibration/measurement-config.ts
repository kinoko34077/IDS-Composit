export type CalibrationMeasurementConfig = {
  /** CSS font-family expression used for both native and composed draws. */
  fontFamily: string;
  /** The fixed em/font size in physical canvas pixels. */
  fontSizePx: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  /** Alphabetic baseline in the physical canvas coordinate system. */
  baselinePx: number;
  /** Default alpha threshold for later ink metric evaluation. */
  alphaThreshold: number;
};

export const DEFAULT_CALIBRATION_MEASUREMENT_CONFIG: Readonly<CalibrationMeasurementConfig> = Object.freeze({
  fontFamily: 'serif',
  fontSizePx: 64,
  canvasWidthPx: 64,
  canvasHeightPx: 64,
  baselinePx: 52,
  alphaThreshold: 0.01,
});

export function validateCalibrationMeasurementConfig(config: CalibrationMeasurementConfig): void {
  if (config.fontFamily.trim().length === 0) throw new RangeError('Calibration fontFamily must not be empty');
  if (!Number.isFinite(config.fontSizePx) || config.fontSizePx <= 0) {
    throw new RangeError('Calibration fontSizePx must be positive and finite');
  }
  if (!Number.isInteger(config.canvasWidthPx) || config.canvasWidthPx <= 0
    || !Number.isInteger(config.canvasHeightPx) || config.canvasHeightPx <= 0) {
    throw new RangeError('Calibration canvas dimensions must be positive integers');
  }
  if (!Number.isFinite(config.baselinePx) || config.baselinePx < 0 || config.baselinePx > config.canvasHeightPx) {
    throw new RangeError('Calibration baselinePx must be inside the canvas');
  }
  if (!Number.isFinite(config.alphaThreshold) || config.alphaThreshold < 0 || config.alphaThreshold > 1) {
    throw new RangeError('Calibration alphaThreshold must be between 0 and 1');
  }
}

export function createCalibrationMeasurementConfig(
  overrides: Partial<CalibrationMeasurementConfig> = {},
): CalibrationMeasurementConfig {
  const config = { ...DEFAULT_CALIBRATION_MEASUREMENT_CONFIG, ...overrides };
  validateCalibrationMeasurementConfig(config);
  return config;
}
