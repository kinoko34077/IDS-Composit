import type { AlphaMask } from '../../src/calibration/types.ts';
import type { Box, LayoutNode } from '../../src/core/types.ts';
import { composeLayout, type ComposeOptions } from '../../src/composition/index.ts';
import { parseIds } from '../../src/parser/parse-ids.ts';
import {
  DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  DEFAULT_CALIBRATION_FONT_METRICS,
  resolveBaselineY,
  type CalibrationFontMetrics,
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
  metrics: CalibrationFontMetrics,
): { context: CanvasRenderingContext2D; baselineY: number } {
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
  return { context, baselineY: resolveBaselineY(config, metrics) };
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
  options: CalibrationRasterOptions = {},
): AlphaMask {
  if (!isSingleUnicodeScalar(character)) {
    throw new RangeError('Calibration character must be exactly one Unicode scalar');
  }
  const prepared = prepareContext(canvas, config, options.fontMetrics ?? DEFAULT_CALIBRATION_FONT_METRICS);
  prepared.context.fillText(character, config.rootX, prepared.baselineY);
  return readAlphaMask(prepared.context, config);
}

function drawLayoutNode(
  node: LayoutNode,
  context: CanvasRenderingContext2D,
  config: CalibrationMeasurementConfig,
  baselineY: number,
): void {
  if (node.type === 'glyph') {
    const pixelX = config.rootX + node.box.x * config.rootWidth;
    const pixelY = config.rootY + node.box.y * config.rootHeight;
    const baselineInSlot = node.box.height > 0
      ? (baselineY - pixelY) / node.box.height
      : 0;
    context.save();
    context.translate(pixelX, pixelY);
    context.scale(node.box.width, node.box.height);
    context.fillText(node.value, 0, baselineInSlot);
    context.restore();
    return;
  }
  for (const child of node.children) drawLayoutNode(child, context, config, baselineY);
}

export type RasterizeCompositionOptions = ComposeOptions;

export type CalibrationRasterOptions = {
  fontMetrics?: CalibrationFontMetrics;
  /** Calibration-only override for the root operator's slots. */
  rootSlots?: readonly Box[];
};

function remapBox(box: Box, oldParent: Box, newParent: Box): Box {
  const oldWidth = oldParent.width;
  const oldHeight = oldParent.height;
  if (oldWidth <= 0 || oldHeight <= 0) {
    throw new RangeError('Calibration layout contains a zero-sized parent box');
  }
  return {
    x: newParent.x + ((box.x - oldParent.x) / oldWidth) * newParent.width,
    y: newParent.y + ((box.y - oldParent.y) / oldHeight) * newParent.height,
    width: (box.width / oldWidth) * newParent.width,
    height: (box.height / oldHeight) * newParent.height,
  };
}

function remapNode(node: LayoutNode, oldParent: Box, newParent: Box): LayoutNode {
  const box = remapBox(node.box, oldParent, newParent);
  if (node.type === 'glyph') return { ...node, box };
  return {
    ...node,
    box,
    children: node.children.map((child) => remapNode(child, node.box, box)),
  };
}

function remapNodeToBox(node: LayoutNode, newBox: Box): LayoutNode {
  if (node.type === 'glyph') return { ...node, box: newBox };
  return {
    ...node,
    box: newBox,
    children: node.children.map((child) => remapNode(child, node.box, newBox)),
  };
}

function applyRootSlots(layout: LayoutNode, rootSlots: readonly Box[] | undefined): LayoutNode {
  if (rootSlots === undefined) return layout;
  if (layout.type !== 'composition') {
    throw new Error('Calibration root slot overrides require a composition root');
  }
  if (rootSlots.length !== layout.children.length) {
    throw new RangeError('Calibration root slot count must match the root operator arity');
  }
  for (const slot of rootSlots) {
    if (![slot.x, slot.y, slot.width, slot.height].every(Number.isFinite)
      || slot.x < 0 || slot.y < 0 || slot.width < 0 || slot.height < 0
      || slot.x + slot.width > 1 || slot.y + slot.height > 1) {
      throw new RangeError('Calibration root slots must be finite boxes inside the normalized root box');
    }
  }
  return {
    ...layout,
    children: layout.children.map((child, index) => {
      const slot = rootSlots[index];
      if (slot === undefined) throw new RangeError('Calibration root slot is missing');
      return remapNodeToBox(child, slot);
    }),
  };
}

export function rasterizeComposedIds(
  canvas: CalibrationCanvas,
  ids: string,
  config: CalibrationMeasurementConfig = DEFAULT_CALIBRATION_MEASUREMENT_CONFIG,
  options: RasterizeCompositionOptions = {},
  rasterOptions: CalibrationRasterOptions = {},
): AlphaMask {
  const parsed = parseIds(ids);
  if (!parsed.ok) throw new Error(`Cannot rasterize invalid IDS: ${parsed.error.message}`);
  const layout = applyRootSlots(composeLayout(parsed.ast, options), rasterOptions.rootSlots);
  const prepared = prepareContext(canvas, config, rasterOptions.fontMetrics ?? DEFAULT_CALIBRATION_FONT_METRICS);
  drawLayoutNode(layout, prepared.context, config, prepared.baselineY);
  return readAlphaMask(prepared.context, config);
}
