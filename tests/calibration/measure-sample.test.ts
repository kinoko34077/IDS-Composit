import { describe, expect, it } from 'vitest';
import { measureCalibrationSample } from '../../tools/calibration/measure-sample';
import type { CalibrationCanvas } from '../../tools/calibration/rasterize';
import { DEFAULT_CALIBRATION_MEASUREMENT_CONFIG } from '../../tools/calibration/measurement-config';

function fakeCanvas(): CalibrationCanvas {
  const context = {
    clearRect: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    scale: () => undefined,
    fillText: () => undefined,
    getImageData: () => ({
      data: new Uint8ClampedArray(DEFAULT_CALIBRATION_MEASUREMENT_CONFIG.canvasWidthPx
        * DEFAULT_CALIBRATION_MEASUREMENT_CONFIG.canvasHeightPx * 4),
    }),
    font: '',
    textBaseline: 'alphabetic',
    fillStyle: '',
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;
  return {
    width: 0,
    height: 0,
    getContext: () => context,
  };
}

describe('calibration sample measurement', () => {
  it('returns native/composition masks and fixed root slots without persisting them to runtime', () => {
    const result = measureCalibrationSample({
      ids: '⿰木可',
      character: '柯',
      font: 'serif',
    }, fakeCanvas);

    expect(result.calibration).toEqual({
      ids: '⿰木可',
      character: '柯',
      font: 'serif',
      slots: [
        { x: 0, y: 0, width: 0.5, height: 1 },
        { x: 0.5, y: 0, width: 0.5, height: 1 },
      ],
      loss: 0,
    });
    expect(result.native.width).toBe(64);
    expect(result.composed.height).toBe(64);
  });

  it('rejects evidence whose declared font differs from the fixed measurement font', () => {
    expect(() => measureCalibrationSample({
      ids: '⿰木可',
      character: '柯',
      font: 'sans-serif',
    }, fakeCanvas)).toThrow(/font/i);
  });
});
