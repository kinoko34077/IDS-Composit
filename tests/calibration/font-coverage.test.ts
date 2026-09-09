import { describe, expect, it } from 'vitest';
import { checkFontCoverage, type FontkitFontLike } from '../../tools/calibration/fonts/coverage';

function fakeFont(missing: readonly number[] = []): FontkitFontLike {
  const missingSet = new Set(missing);
  return {
    unitsPerEm: 1000,
    ascent: 880,
    descent: -120,
    hasGlyphForCodePoint: (codePoint) => !missingSet.has(codePoint),
  };
}

describe('fontkit Calibration coverage gate', () => {
  it('requires target and every IDS leaf glyph', () => {
    const result = checkFontCoverage('fixture.otf', '東', '⿰木日', {
      openFont: () => fakeFont([...'日'].length === 1 ? ['日'.codePointAt(0)!] : []),
    });

    expect(result.knownEligible).toBe(true);
    expect(result.fontSupported).toBe(false);
    expect(result.rasterEligible).toBe(false);
    expect(result.missingCodePoints).toEqual(['日'.codePointAt(0)]);
  });

  it('rejects a missing target glyph and malformed IDS', () => {
    const missingTarget = checkFontCoverage('fixture.otf', '東', '⿰木日', {
      openFont: () => fakeFont(['東'.codePointAt(0)!]),
    });
    expect(missingTarget.missingCodePoints).toEqual(['東'.codePointAt(0)]);
    expect(missingTarget.knownEligible).toBe(true);

    const malformed = checkFontCoverage('fixture.otf', '東', '⿰木', {
      openFont: () => fakeFont(),
    });
    expect(malformed).toMatchObject({ knownEligible: false, fontSupported: false, rasterEligible: false });
  });

  it('reports metrics and separates a fully supported sample as raster-eligible', () => {
    const result = checkFontCoverage('fixture.otf', '東', '⿰木日', {
      openFont: () => fakeFont(),
    });
    expect(result).toMatchObject({
      knownEligible: true,
      fontSupported: true,
      rasterEligible: true,
      metrics: { unitsPerEm: 1000, ascent: 880, descent: -120 },
      missingCodePoints: [],
    });
  });
});
