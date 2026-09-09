import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import type { CalibrationCanvas } from '../rasterize.ts';

/** Register the exact downloaded OTF; no OS font fallback is used. */
export function registerCalibrationFont(fontPath: string, family: string): void {
  const registered = GlobalFonts.registerFromPath(fontPath, family);
  if (registered === null) throw new Error(`Calibration font registration failed: ${fontPath}`);
}

export function createCalibrationCanvas(width = 160, height = 160): CalibrationCanvas {
  return createCanvas(width, height) as unknown as CalibrationCanvas;
}
