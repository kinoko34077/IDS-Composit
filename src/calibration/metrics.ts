import type { AlphaMask, InkBounds, Point } from './types';

function pixelIndex(mask: AlphaMask, x: number, y: number): number {
  return y * mask.width + x;
}

export function measureInkBounds(mask: AlphaMask, threshold = 0.01): InkBounds | null {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if ((mask.data[pixelIndex(mask, x, y)] ?? 0) <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

export function measureOccupiedArea(mask: AlphaMask): number {
  if (mask.data.length === 0) return 0;
  const total = mask.data.reduce((sum, alpha) => sum + Math.max(0, Math.min(1, alpha)), 0);
  return total / mask.data.length;
}

export function measureCentroid(mask: AlphaMask): Point | null {
  let weight = 0;
  let xTotal = 0;
  let yTotal = 0;
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      const alpha = Math.max(0, Math.min(1, mask.data[pixelIndex(mask, x, y)] ?? 0));
      weight += alpha;
      xTotal += (x + 0.5) * alpha;
      yTotal += (y + 0.5) * alpha;
    }
  }
  return weight === 0 ? null : { x: xTotal / weight, y: yTotal / weight };
}

export function measureAxisOccupancy(mask: AlphaMask): { horizontal: number[]; vertical: number[] } {
  const horizontal = Array.from({ length: mask.width }, () => 0);
  const vertical = Array.from({ length: mask.height }, () => 0);
  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      const alpha = Math.max(0, Math.min(1, mask.data[pixelIndex(mask, x, y)] ?? 0));
      horizontal[x] = (horizontal[x] ?? 0) + alpha;
      vertical[y] = (vertical[y] ?? 0) + alpha;
    }
  }
  return { horizontal, vertical };
}

export function alphaMaskSimilarity(first: AlphaMask, second: AlphaMask): number {
  if (first.width !== second.width || first.height !== second.height || first.data.length !== second.data.length) return 0;
  if (first.data.length === 0) return 1;
  const difference = first.data.reduce((sum, alpha, index) => sum + Math.abs(alpha - (second.data[index] ?? 0)), 0);
  return Math.max(0, 1 - difference / first.data.length);
}
