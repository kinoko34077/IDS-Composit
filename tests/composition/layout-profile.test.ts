import { describe, expect, it } from 'vitest';
import { composeLayout } from '../../src/composition';
import { DEFAULT_LAYOUT_PROFILES } from '../../src/data/layout-profiles';

describe('Generic Layout Profile integration', () => {
  it('exposes the accepted compact runtime profile', () => {
    const layout = composeLayout({
      type: 'composition',
      operator: '⿰',
      children: [
        { type: 'char', value: '木' },
        { type: 'char', value: '可' },
      ],
    }, { layoutProfiles: DEFAULT_LAYOUT_PROFILES });
    if (layout.type !== 'composition') throw new Error('Expected a composition layout');

    expect(layout).toMatchObject({
      children: [
        { box: { x: 0, y: 0, width: 0.54, height: 1 } },
        { box: { y: 0, height: 1 } },
      ],
    });
    expect(layout.children[1]?.box.x).toBeCloseTo(0.4, 12);
    expect(layout.children[1]?.box.width).toBeCloseTo(0.59, 12);
  });

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
