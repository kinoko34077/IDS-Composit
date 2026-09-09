import { parseIds } from '../../../src/parser/parse-ids.ts';
import type { IdsNode } from '../../../src/core/types.ts';
import type { CalibrationSourceRecord } from './types.ts';

const SPECIAL_COMPONENT_PATTERN = /[#{}?？]/u;

export function isUnicodeScalar(value: string): boolean {
  const codePoints = Array.from(value);
  if (codePoints.length !== 1) return false;
  const codePoint = codePoints[0]?.codePointAt(0);
  return codePoint !== undefined
    && codePoint <= 0x10ffff
    && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
}

function isSafeLeaf(value: string): boolean {
  if (!isUnicodeScalar(value) || SPECIAL_COMPONENT_PATTERN.test(value)) return false;
  const codePoint = value.codePointAt(0);
  return codePoint !== undefined && !/^[\u0000-\u0020\u007f-\u009f]$/u.test(value);
}

function hasOnlySafeLeaves(node: IdsNode): boolean {
  if (node.type === 'char') return isSafeLeaf(node.value);
  return node.children.every(hasOnlySafeLeaves);
}

/**
 * Calibration currently measures supported spatial compositions only. A
 * source mapping may still be useful to Resolver even when this check fails.
 */
export function isCalibrationEligibleIds(ids: string): boolean {
  if (SPECIAL_COMPONENT_PATTERN.test(ids)) return false;
  const parsed = parseIds(ids);
  return parsed.ok
    && parsed.ast.type === 'composition'
    && hasOnlySafeLeaves(parsed.ast);
}

export function normalizeCalibrationText(value: string): string {
  return value.normalize('NFC');
}

export function withCalibrationProvenance(
  record: Omit<CalibrationSourceRecord, 'source' | 'sourceVersion' | 'sourceHash'>,
  source: { name: string; version: string; fileHash?: string },
): CalibrationSourceRecord {
  return {
    ...record,
    source: source.name,
    sourceVersion: source.version,
    ...(source.fileHash === undefined ? {} : { sourceHash: source.fileHash }),
  };
}
