import { alphaMaskSimilarity } from '../../src/calibration/metrics.ts';
import type { CharacterCalibration, AlphaMask } from '../../src/calibration/types.ts';
import { composeLayout } from '../../src/composition/index.ts';
import type { Box } from '../../src/core/types.ts';
import { parseIds } from '../../src/parser/parse-ids.ts';
import {
  rasterizeComposedIds,
  rasterizeNativeGlyph,
  type CalibrationCanvas,
  type CalibrationRasterOptions,
  type RasterizeCompositionOptions,
} from './rasterize.ts';
import {
  DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  type CalibrationMeasurementConfig,
} from './measurement-config.ts';
import { calculateCalibrationLoss, type CalibrationLossBreakdown } from './loss-v1.ts';

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
  lossBreakdown: CalibrationLossBreakdown;
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
  rasterOptions: CalibrationRasterOptions = {},
): CalibrationSampleMeasurement {
  if (sample.font.trim() !== config.fontFamily.trim()) {
    throw new RangeError('Calibration sample font must match measurement config fontFamily');
  }
  const native = rasterizeNativeGlyph(createCanvas(), sample.character, config, rasterOptions);
  const composed = rasterizeComposedIds(createCanvas(), sample.ids, config, options, rasterOptions);
  const lossBreakdown = calculateCalibrationLoss(native, composed, {
    x: config.rootX,
    y: config.rootY,
    width: config.rootWidth,
    height: config.rootHeight,
  });
  const loss = lossBreakdown.total;
  if (!Number.isFinite(loss) || !Number.isFinite(1 - alphaMaskSimilarity(native, composed))) {
    throw new RangeError('Calibration sample loss must be finite');
  }
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
    lossBreakdown,
  };
}
