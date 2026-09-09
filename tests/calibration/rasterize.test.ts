import { describe, expect, it, vi } from 'vitest';
import {
  rasterizeComposedIds,
  rasterizeNativeGlyph,
  type CalibrationCanvas,
} from '../../tools/calibration/rasterize';
import { DEFAULT_CALIBRATION_MEASUREMENT_CONFIG } from '../../tools/calibration/measurement-config';

function createFakeCanvas(): {
  canvas: CalibrationCanvas;
  context: {
    clearRect: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    translate: ReturnType<typeof vi.fn>;
    scale: ReturnType<typeof vi.fn>;
    fillText: ReturnType<typeof vi.fn>;
    getImageData: ReturnType<typeof vi.fn>;
    font: string;
    textBaseline: string;
    fillStyle: string;
    globalAlpha: number;
  };
} {
  const context = {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(DEFAULT_CALIBRATION_MEASUREMENT_CONFIG.canvasWidthPx
        * DEFAULT_CALIBRATION_MEASUREMENT_CONFIG.canvasHeightPx * 4),
    })),
    font: '',
    textBaseline: '',
    fillStyle: '',
    globalAlpha: 0,
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
  } as unknown as CalibrationCanvas;
  return { canvas, context };
}

describe('calibration rasterizer', () => {
  it('rasterizes a native glyph under the fixed font and baseline condition', () => {
    const { canvas, context } = createFakeCanvas();
    const mask = rasterizeNativeGlyph(canvas, '街');

    expect(canvas.width).toBe(64);
    expect(canvas.height).toBe(64);
    expect(context.font).toBe('64px serif');
    expect(context.textBaseline).toBe('alphabetic');
    expect(context.fillText).toHaveBeenCalledWith('街', 0, 52);
    expect(mask).toEqual({
      width: 64,
      height: 64,
      data: expect.any(Array),
    });
  });

  it('rejects a multi-scalar target instead of measuring a text run as one glyph', () => {
    const { canvas } = createFakeCanvas();
    expect(() => rasterizeNativeGlyph(canvas, '街道')).toThrow(/Unicode scalar/i);
  });

  it('rasterizes every leaf of a nested composition in root-absolute boxes', () => {
    const { canvas, context } = createFakeCanvas();
    const mask = rasterizeComposedIds(canvas, '⿰木⿱日月');

    expect(mask.width).toBe(64);
    expect(context.fillText.mock.calls.map(([value]) => value)).toEqual(['木', '日', '月']);
    expect(context.translate.mock.calls).toEqual([
      [0, 0],
      [32, 0],
      [32, 32],
    ]);
    expect(context.scale.mock.calls).toEqual([
      [0.5, 1],
      [0.5, 0.5],
      [0.5, 0.5],
    ]);
  });

  it('rejects malformed or unsupported composition input instead of producing evidence', () => {
    const { canvas } = createFakeCanvas();
    expect(() => rasterizeComposedIds(canvas, '⿾木可')).toThrow(/unsupported|operator|IDS/i);
  });
});
