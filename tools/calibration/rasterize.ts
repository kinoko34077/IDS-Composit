import type { AlphaMask } from '../../src/calibration/types.ts';
import type { LayoutNode } from '../../src/core/types.ts';
import { composeLayout, type ComposeOptions } from '../../src/composition/index.ts';
import { parseIds } from '../../src/parser/parse-ids.ts';
import {
  DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  validateCalibrationMeasurementConfig,
  type CalibrationMeasurementConfig,
} from './measurement-config.ts';

/**
 * Minimal canvas boundary for calibration tools. This type is deliberately
 * local to tools/calibration and is not exported from the runtime package.
 */
export type CalibrationCanvas = {
  width: number;
  height: number;
  getContext(
    contextId: '2d',
    options?: CanvasRenderingContext2DSettings,
  ): CanvasRenderingContext2D | null;
};

function prepareContext(
  canvas: CalibrationCanvas,
  config: CalibrationMeasurementConfig,
): CanvasRenderingContext2D {
  validateCalibrationMeasurementConfig(config);
  canvas.width = config.canvasWidthPx;
  canvas.height = config.canvasHeightPx;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new Error('Calibration canvas does not provide a 2D context');
  context.clearRect(0, 0, config.canvasWidthPx, config.canvasHeightPx);
  context.font = `${config.fontSizePx}px ${config.fontFamily}`;
  context.textBaseline = 'alphabetic';
  context.fillStyle = 'rgba(0, 0, 0, 1)';
  context.globalAlpha = 1;
  return context;
}

function readAlphaMask(
  context: CanvasRenderingContext2D,
  config: CalibrationMeasurementConfig,
): AlphaMask {
  const image = context.getImageData(0, 0, config.canvasWidthPx, config.canvasHeightPx);
  const data: number[] = [];
  for (let pixel = 0; pixel < config.canvasWidthPx * config.canvasHeightPx; pixel += 1) {
    data.push((image.data[pixel * 4 + 3] ?? 0) / 255);
  }
  return {
    width: config.canvasWidthPx,
    height: config.canvasHeightPx,
    data,
  };
}

function isSingleUnicodeScalar(value: string): boolean {
  const codePoints = Array.from(value);
  if (codePoints.length !== 1) return false;
  const codePoint = codePoints[0]?.codePointAt(0);
  return codePoint !== undefined
    && codePoint <= 0x10ffff
    && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
}

export function rasterizeNativeGlyph(
  canvas: CalibrationCanvas,
  character: string,
  config: CalibrationMeasurementConfig = DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
): AlphaMask {
  if (!isSingleUnicodeScalar(character)) {
    throw new RangeError('Calibration character must be exactly one Unicode scalar');
  }
  const context = prepareContext(canvas, config);
  context.fillText(character, 0, config.baselinePx);
  return readAlphaMask(context, config);
}

function drawLayoutNode(
  node: LayoutNode,
  context: CanvasRenderingContext2D,
  config: CalibrationMeasurementConfig,
): void {
  if (node.type === 'glyph') {
    context.save();
    context.translate(node.box.x * config.canvasWidthPx, node.box.y * config.canvasHeightPx);
    context.scale(node.box.width, node.box.height);
    context.fillText(node.value, 0, config.baselinePx);
    context.restore();
    return;
  }
  for (const child of node.children) drawLayoutNode(child, context, config);
}

export type RasterizeCompositionOptions = ComposeOptions;

export function rasterizeComposedIds(
  canvas: CalibrationCanvas,
  ids: string,
  config: CalibrationMeasurementConfig = DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  options: RasterizeCompositionOptions = {},
): AlphaMask {
  const parsed = parseIds(ids);
  if (!parsed.ok) throw new Error(`Cannot rasterize invalid IDS: ${parsed.error.message}`);
  const layout = composeLayout(parsed.ast, options);
  const context = prepareContext(canvas, config);
  drawLayoutNode(layout, context, config);
  return readAlphaMask(context, config);
}
