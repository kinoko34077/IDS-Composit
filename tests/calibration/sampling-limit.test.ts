import { describe, expect, it } from 'vitest';
import { limitPrimaryTrainingSamples } from '../../tools/calibration/generate-source-corpus';

describe('Calibration primary training cap', () => {
  it('caps each operator at 2,000 samples in stable hash order', () => {
    const samples = Array.from({ length: 2_005 }, (_, index) => ({
      operator: '⿰',
      character: String.fromCodePoint(0x3400 + index),
      ids: `⿰木${String.fromCodePoint(0x3400 + index)}`,
    }));
    const first = limitPrimaryTrainingSamples(samples);
    const second = limitPrimaryTrainingSamples([...samples].reverse());

    expect(first).toHaveLength(2_000);
    expect(second).toEqual(first);
    expect(new Set(first.map((sample) => sample.character)).size).toBe(2_000);
  });

  it('caps operators independently and rejects invalid limits', () => {
    const samples = [
      { operator: '⿰', character: '一', ids: '⿰木一' },
      { operator: '⿱', character: '二', ids: '⿱木二' },
    ];
    expect(limitPrimaryTrainingSamples(samples, 1)).toHaveLength(2);
    expect(() => limitPrimaryTrainingSamples(samples, 0)).toThrow(/positive/i);
  });
});
