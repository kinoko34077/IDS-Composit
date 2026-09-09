import type { AlphaMask } from '../../src/calibration/types.ts';

export type RootEmBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CalibrationLossBreakdown = {
  axisOccupancy: number;
  inkBounds: number;
  centroid: number;
  occupiedArea: number;
  alphaMask: number;
  total: number;
};

type Region = { left: number; top: number; right: number; bottom: number };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function alpha(mask: AlphaMask, x: number, y: number): number {
  return clamp01(mask.data[y * mask.width + x] ?? 0);
}

function regionFor(mask: AlphaMask, root: RootEmBox): Region {
  if (![root.x, root.y, root.width, root.height].every(Number.isFinite)
    || root.width <= 0 || root.height <= 0
    || root.x < 0 || root.y < 0
    || root.x + root.width > mask.width || root.y + root.height > mask.height) {
    throw new RangeError('Calibration root em box must be finite and inside the mask');
  }
  return {
    left: Math.floor(root.x),
    top: Math.floor(root.y),
    right: Math.ceil(root.x + root.width),
    bottom: Math.ceil(root.y + root.height),
  };
}

function assertComparable(nativeMask: AlphaMask, composedMask: AlphaMask, root: RootEmBox): Region {
  if (nativeMask.width !== composedMask.width || nativeMask.height !== composedMask.height) {
    throw new RangeError('Calibration loss masks must have equal dimensions');
  }
  return regionFor(nativeMask, root);
}

function rootAxis(mask: AlphaMask, region: Region): { horizontal: number[]; vertical: number[] } {
  const horizontal = Array.from({ length: region.right - region.left }, () => 0);
  const vertical = Array.from({ length: region.bottom - region.top }, () => 0);
  for (let y = region.top; y < region.bottom; y += 1) {
    for (let x = region.left; x < region.right; x += 1) {
      const value = alpha(mask, x, y);
      horizontal[x - region.left] = (horizontal[x - region.left] ?? 0) + value;
      vertical[y - region.top] = (vertical[y - region.top] ?? 0) + value;
    }
  }
  return { horizontal, vertical };
}

function normalizedL1(first: readonly number[], second: readonly number[]): number {
  const firstTotal = first.reduce((sum, value) => sum + value, 0);
  const secondTotal = second.reduce((sum, value) => sum + value, 0);
  if (firstTotal === 0 && secondTotal === 0) return 0;
  if (firstTotal === 0 || secondTotal === 0) return 1;
  const length = Math.max(first.length, second.length);
  const difference = Array.from({ length }, (_, index) => Math.abs(
    (first[index] ?? 0) / firstTotal - (second[index] ?? 0) / secondTotal,
  )).reduce((sum, value) => sum + value, 0);
  return clamp01(difference / 2);
}

function axisOccupancyLoss(nativeMask: AlphaMask, composedMask: AlphaMask, region: Region): number {
  const nativeAxis = rootAxis(nativeMask, region);
  const composedAxis = rootAxis(composedMask, region);
  return (normalizedL1(nativeAxis.horizontal, composedAxis.horizontal)
    + normalizedL1(nativeAxis.vertical, composedAxis.vertical)) / 2;
}

function rootInkBounds(mask: AlphaMask, region: Region, root: RootEmBox): [number, number, number, number] | null {
  let minX = region.right;
  let minY = region.bottom;
  let maxX = -1;
  let maxY = -1;
  for (let y = region.top; y < region.bottom; y += 1) {
    for (let x = region.left; x < region.right; x += 1) {
      if (alpha(mask, x, y) <= 0.01) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return null;
  return [
    (minX - root.x) / root.width,
    (minY - root.y) / root.height,
    (maxX + 1 - root.x) / root.width,
    (maxY + 1 - root.y) / root.height,
  ];
}

function boundsLoss(nativeMask: AlphaMask, composedMask: AlphaMask, region: Region, root: RootEmBox): number {
  const nativeBounds = rootInkBounds(nativeMask, region, root);
  const composedBounds = rootInkBounds(composedMask, region, root);
  if (nativeBounds === null && composedBounds === null) return 0;
  if (nativeBounds === null || composedBounds === null) return 1;
  const difference = nativeBounds.reduce((sum, value, index) => sum + Math.abs(value - (composedBounds[index] ?? 0)), 0);
  return clamp01(difference / nativeBounds.length);
}

function rootCentroid(mask: AlphaMask, region: Region, root: RootEmBox): { x: number; y: number } | null {
  let weight = 0;
  let xTotal = 0;
  let yTotal = 0;
  for (let y = region.top; y < region.bottom; y += 1) {
    for (let x = region.left; x < region.right; x += 1) {
      const value = alpha(mask, x, y);
      weight += value;
      xTotal += ((x + 0.5 - root.x) / root.width) * value;
      yTotal += ((y + 0.5 - root.y) / root.height) * value;
    }
  }
  return weight === 0 ? null : { x: xTotal / weight, y: yTotal / weight };
}

function centroidLoss(nativeMask: AlphaMask, composedMask: AlphaMask, region: Region, root: RootEmBox): number {
  const nativeCentroid = rootCentroid(nativeMask, region, root);
  const composedCentroid = rootCentroid(composedMask, region, root);
  if (nativeCentroid === null && composedCentroid === null) return 0;
  if (nativeCentroid === null || composedCentroid === null) return 1;
  return clamp01(Math.hypot(
    nativeCentroid.x - composedCentroid.x,
    nativeCentroid.y - composedCentroid.y,
  ) / Math.sqrt(2));
}

function rootArea(mask: AlphaMask, region: Region, root: RootEmBox): number {
  let total = 0;
  for (let y = region.top; y < region.bottom; y += 1) {
    for (let x = region.left; x < region.right; x += 1) total += alpha(mask, x, y);
  }
  return total / (root.width * root.height);
}

function occupiedAreaLoss(nativeMask: AlphaMask, composedMask: AlphaMask, region: Region, root: RootEmBox): number {
  return clamp01(Math.abs(rootArea(nativeMask, region, root) - rootArea(composedMask, region, root)));
}

function alphaMaskLoss(nativeMask: AlphaMask, composedMask: AlphaMask, region: Region): number {
  let difference = 0;
  let count = 0;
  for (let y = region.top; y < region.bottom; y += 1) {
    for (let x = region.left; x < region.right; x += 1) {
      difference += Math.abs(alpha(nativeMask, x, y) - alpha(composedMask, x, y));
      count += 1;
    }
  }
  return count === 0 ? 0 : clamp01(difference / count);
}

export function calculateCalibrationLoss(
  nativeMask: AlphaMask,
  composedMask: AlphaMask,
  root: RootEmBox,
): CalibrationLossBreakdown {
  const region = assertComparable(nativeMask, composedMask, root);
  const breakdown = {
    axisOccupancy: axisOccupancyLoss(nativeMask, composedMask, region),
    inkBounds: boundsLoss(nativeMask, composedMask, region, root),
    centroid: centroidLoss(nativeMask, composedMask, region, root),
    occupiedArea: occupiedAreaLoss(nativeMask, composedMask, region, root),
    alphaMask: alphaMaskLoss(nativeMask, composedMask, region),
  };
  return {
    ...breakdown,
    total: breakdown.axisOccupancy * 0.4
      + breakdown.inkBounds * 0.25
      + breakdown.centroid * 0.15
      + breakdown.occupiedArea * 0.1
      + breakdown.alphaMask * 0.1,
  };
}
