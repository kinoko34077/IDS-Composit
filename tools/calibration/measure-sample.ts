import { alphaMaskSimilarity } from '../../src/calibration/metrics.ts';
import type { CharacterCalibration, AlphaMask } from '../../src/calibration/types.ts';
import { composeLayout } from '../../src/composition/index.ts';
import type { Box } from '../../src/core/types.ts';
import { parseIds } from '../../src/parser/parse-ids.ts';
import {
  rasterizeComposedIds,
  rasterizeNativeGlyph,
  type CalibrationCanvas,
  type RasterizeCompositionOptions,
} from './rasterize.ts';
import {
  DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  type CalibrationMeasurementConfig,
} from './measurement-config.ts';

export type CalibrationCanvasFactory = () => CalibrationCanvas;

export type CalibrationSampleInput = {
  ids: string;
  character: string;
  font: string;
};

export type CalibrationSampleMeasurement = {
  calibration: CharacterCalibration;
  native: AlphaMask;
  composed: AlphaMask;
};

function topLevelSlots(
  ids: string,
  options: RasterizeCompositionOptions,
): Box[] {
  const parsed = parseIds(ids);
  if (!parsed.ok) throw new Error(`Cannot measure invalid IDS: ${parsed.error.message}`);
  const layout = composeLayout(parsed.ast, options);
  if (layout.type !== 'composition') throw new Error('Calibration IDS must have a composition root');
  return layout.children.map((child) => ({ ...child.box }));
}

export function measureCalibrationSample(
  sample: CalibrationSampleInput,
  createCanvas: CalibrationCanvasFactory,
  config: CalibrationMeasurementConfig = DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  options: RasterizeCompositionOptions = {},
): CalibrationSampleMeasurement {
  if (sample.font.trim() !== config.fontFamily.trim()) {
    throw new RangeError('Calibration sample font must match measurement config fontFamily');
  }
  const native = rasterizeNativeGlyph(createCanvas(), sample.character, config);
  const composed = rasterizeComposedIds(createCanvas(), sample.ids, config, options);
  const loss = 1 - alphaMaskSimilarity(native, composed);
  if (!Number.isFinite(loss)) throw new RangeError('Calibration sample loss must be finite');
  return {
    calibration: {
      ids: sample.ids,
      character: sample.character,
      font: sample.font,
      slots: topLevelSlots(sample.ids, options),
      loss,
    },
    native,
    composed,
  };
}
