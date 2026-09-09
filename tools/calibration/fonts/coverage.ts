import { openSync, type Font } from 'fontkit';
import type { IdsNode } from '../../../src/core/types.ts';
import { parseIds } from '../../../src/parser/parse-ids.ts';
import { isCalibrationEligibleIds, isUnicodeScalar } from '../sources/common.ts';

export type FontkitFontLike = Pick<Font, 'unitsPerEm' | 'ascent' | 'descent' | 'hasGlyphForCodePoint'>;

export type FontCoverageResult = {
  knownEligible: boolean;
  fontSupported: boolean;
  rasterEligible: boolean;
  missingCodePoints: number[];
  metrics: {
    unitsPerEm: number;
    ascent: number;
    descent: number;
  };
};

export type FontCoverageOptions = {
  openFont?: (fontPath: string) => FontkitFontLike;
};

function collectLeaves(node: IdsNode, leaves: string[]): void {
  if (node.type === 'char') {
    leaves.push(node.value);
    return;
  }
  for (const child of node.children) collectLeaves(child, leaves);
}

function emptyMetrics(): FontCoverageResult['metrics'] {
  return { unitsPerEm: 0, ascent: 0, descent: 0 };
}

export function checkFontCoverage(
  fontPath: string,
  character: string,
  ids: string,
  options: FontCoverageOptions = {},
): FontCoverageResult {
  const parsed = parseIds(ids);
  const knownEligible = isUnicodeScalar(character)
    && isCalibrationEligibleIds(ids)
    && parsed.ok
    && parsed.ast.type === 'composition';
  if (!knownEligible || !parsed.ok || parsed.ast.type !== 'composition') {
    return {
      knownEligible: false,
      fontSupported: false,
      rasterEligible: false,
      missingCodePoints: [],
      metrics: emptyMetrics(),
    };
  }

  const font = (options.openFont ?? openSync)(fontPath);
  const leaves: string[] = [];
  collectLeaves(parsed.ast, leaves);
  const codePoints = [...new Set([
    character.codePointAt(0)!,
    ...leaves.map((leaf) => leaf.codePointAt(0)!),
  ])];
  const missingCodePoints = codePoints.filter((codePoint) => !font.hasGlyphForCodePoint(codePoint)).sort((left, right) => left - right);
  const fontSupported = missingCodePoints.length === 0;
  const metrics = {
    unitsPerEm: font.unitsPerEm,
    ascent: font.ascent,
    descent: font.descent,
  };
  const rasterEligible = fontSupported
    && Number.isFinite(metrics.unitsPerEm) && metrics.unitsPerEm > 0
    && Number.isFinite(metrics.ascent) && Number.isFinite(metrics.descent);
  return { knownEligible, fontSupported, rasterEligible, missingCodePoints, metrics };
}
