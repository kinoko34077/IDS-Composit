import { describe, expect, it } from 'vitest';
import { composeLayout } from '../../src/composition';

describe('Generic Layout Profile integration', () => {
  it('uses normalized profile slots when the operator profile is complete', () => {
    const layout = composeLayout({
      type: 'composition',
      operator: '⿰',
      children: [
        { type: 'char', value: '木' },
        { type: 'char', value: '可' },
      ],
    }, {
      layoutProfiles: {
        '⿰': {
          operator: '⿰',
          slots: [
            { role: 'left', x: 0, y: 0, width: 0.6, height: 1 },
            { role: 'right', x: 0.4, y: 0, width: 0.6, height: 1 },
          ],
          sampleCount: 12,
          corpusVersion: 'v0.2-test',
        },
      },
    });

    expect(layout).toMatchObject({
      children: [
        { box: { x: 0, y: 0, width: 0.6, height: 1 } },
        { box: { x: 0.4, y: 0, width: 0.6, height: 1 } },
      ],
    });
  });

  it('falls back to the fixed template when a profile is incomplete', () => {
    const layout = composeLayout({
      type: 'composition',
      operator: '⿰',
      children: [
        { type: 'char', value: '木' },
        { type: 'char', value: '可' },
      ],
    }, {
      layoutProfiles: {
        '⿰': {
          operator: '⿰',
          slots: [{ role: 'left', x: 0, y: 0, width: 0.8, height: 1 }],
          sampleCount: 1,
          corpusVersion: 'v0.2-test',
        },
      },
    });

    expect(layout).toMatchObject({ children: [{ box: { width: 0.5 } }, { box: { x: 0.5, width: 0.5 } }] });
  });
});
