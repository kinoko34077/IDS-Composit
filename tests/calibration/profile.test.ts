import { describe, expect, it } from 'vitest';
import { buildLayoutProfiles } from '../../tools/calibration/profile';

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
});
