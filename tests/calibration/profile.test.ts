import { describe, expect, it } from 'vitest';
import { buildLayoutProfileReport, buildLayoutProfiles } from '../../tools/calibration/profile';

describe('calibration profile aggregation', () => {
  it('aggregates evidence by operator and preserves structural roles', () => {
    const profiles = buildLayoutProfiles([
      {
        ids: '⿰木可', character: '某', font: 'serif', operator: '⿰', loss: 0.2,
        slots: [
          { role: 'left', x: 0, y: 0, width: 0.48, height: 1 },
          { role: 'right', x: 0.52, y: 0, width: 0.48, height: 1 },
        ],
      },
      {
        ids: '⿰日月', character: '明', font: 'serif', operator: '⿰', loss: 0.3,
        slots: [
          { role: 'left', x: 0, y: 0, width: 0.52, height: 1 },
          { role: 'right', x: 0.48, y: 0, width: 0.52, height: 1 },
        ],
      },
    ], 'v0.2-test');

    expect(profiles['⿰']).toEqual({
      operator: '⿰',
      sampleCount: 2,
      corpusVersion: 'v0.2-test',
      slots: [
        { role: 'left', x: 0, y: 0, width: 0.5, height: 1 },
        { role: 'right', x: 0.5, y: 0, width: 0.5, height: 1 },
      ],
    });
  });

  it('does not create a profile from malformed or non-finite evidence', () => {
    const profiles = buildLayoutProfiles([
      {
        ids: '⿰木可', character: '某', font: 'serif', operator: '⿰', loss: Number.NaN,
        slots: [
          { role: 'left', x: 0, y: 0, width: 0.5, height: 1 },
          { role: 'right', x: 0.5, y: 0, width: 0.5, height: 1 },
        ],
      },
    ], 'v0.2-test');

    expect(profiles).toEqual({});
  });

  it('uses coordinate-wise median and exposes distribution statistics', () => {
    const evidence = [0.1, 0.2, 0.9].map((x, index) => ({
      ids: `⿰木${index}`,
      character: String.fromCodePoint(0x4e00 + index),
      font: 'Source Han Sans JP',
      operator: '⿰',
      loss: x,
      slots: [
        { role: 'left' as const, x, y: 0.1 + x / 10, width: 0.1, height: 0.8 },
        { role: 'right' as const, x: 0.5, y: 0, width: 0.5, height: 1 },
      ],
    }));
    const result = buildLayoutProfileReport(evidence, 'v0.2-test');

    expect(result.profiles['⿰']?.slots[0]).toMatchObject({
      role: 'left', x: 0.2, width: 0.1, height: 0.8,
    });
    expect(result.profiles['⿰']?.slots[0]?.y).toBeCloseTo(0.12, 10);
    expect(result.distributions['⿰']?.[0]).toMatchObject({
      role: 'left',
      x: { p10: 0.1, p25: 0.1, p50: 0.2, p75: 0.9, p90: 0.9, sampleCount: 3 },
    });
    expect(result.distributions['⿰']?.[0]?.x.mean).toBeCloseTo(0.4, 10);
  });
});
