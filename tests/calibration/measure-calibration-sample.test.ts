import { describe, expect, it } from 'vitest';
import { buildCalibrationSampleSummary } from '../../tools/calibration/measure-calibration-sample';
import type { CalibrationSampleMeasurement } from '../../tools/calibration/measure-sample';
import type { FontCoverageResult } from '../../tools/calibration/fonts/coverage';
import { DEFAULT_CALIBRATION_MEASUREMENT_CONFIG } from '../../tools/calibration/measurement-config';

const coverage: FontCoverageResult = {
  knownEligible: true,
  fontSupported: true,
  rasterEligible: true,
  missingCodePoints: [],
  metrics: { unitsPerEm: 1000, ascent: 880, descent: -120 },
};

const measurement = {
  calibration: {
    ids: '⿰木可',
    character: '柯',
    font: 'Source Han Sans JP',
    slots: [
      { x: 0, y: 0, width: 0.5, height: 1 },
      { x: 0.5, y: 0, width: 0.5, height: 1 },
    ],
    loss: 0.25,
  },
  native: { width: 160, height: 160, data: [] },
  composed: { width: 160, height: 160, data: [] },
  lossBreakdown: {
    axisOccupancy: 0.1,
    inkBounds: 0.2,
    centroid: 0.3,
    occupiedArea: 0.4,
    alphaMask: 0.5,
    total: 0.25,
  },
} satisfies CalibrationSampleMeasurement;

describe('real calibration sample summary', () => {
  it('records geometry, metrics, coverage, and sub-losses without raw masks', () => {
    const summary = buildCalibrationSampleSummary({
      font: {
        id: 'source-han-sans-jp-regular',
        family: 'Source Han Sans JP',
        version: '2.005R',
        sha256: 'sha256:font',
      },
      coverage,
      measurement,
      config: DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
    });

    expect(summary).toMatchObject({
      schemaVersion: 'ids-composit-calibration-sample/v0.2',
      font: { id: 'source-han-sans-jp-regular', sha256: 'sha256:font' },
      coverage: { knownEligible: true, fontSupported: true, rasterEligible: true },
      geometry: {
        canvasWidthPx: 160,
        canvasHeightPx: 160,
        rootX: 16,
        rootY: 16,
        rootWidth: 128,
        rootHeight: 128,
        baselineY: 128.64,
      },
      loss: measurement.lossBreakdown,
    });
    expect(summary).not.toHaveProperty('native');
    expect(summary).not.toHaveProperty('composed');
  });
});
