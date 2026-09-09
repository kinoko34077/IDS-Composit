import { describe, expect, it } from 'vitest';
import { buildCalibrationCorpus } from '../../tools/calibration/corpus';
import type { KnownCharacterEntry } from '../../src/known';

const entries: KnownCharacterEntry[] = [
  { ids: '⿲彳圭亍', character: '街', source: 'test', status: 'verified' },
  { ids: '⿰木可', character: '柯', source: 'test', status: 'verified' },
  { ids: '⿾木可', character: 'x', source: 'test', status: 'verified' },
  { ids: '⿰木可', character: 'candidate', source: 'test', status: 'candidate' },
];

describe('calibration corpus', () => {
  it('filters verified supported entries and keeps train/holdout separate', () => {
    const corpus = buildCalibrationCorpus(entries, {
      targetAvailable: () => true,
      componentAvailable: () => true,
      split: (_entry, index) => index % 2 === 0 ? 'train' : 'holdout',
    });

    expect(corpus.version).toBe('v0.2');
    expect(corpus.train.map((entry) => entry.character)).toEqual(['街']);
    expect(corpus.holdout.map((entry) => entry.character)).toEqual(['柯']);
    expect(corpus.train[0]?.components).toEqual(['彳', '圭', '亍']);
  });
});
