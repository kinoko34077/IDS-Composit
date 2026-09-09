import { describe, expect, it } from 'vitest';
import { buildCalibrationSourceCorpus } from '../../tools/calibration/generate-source-corpus';
import type { CalibrationSourceRecord } from '../../tools/calibration/sources/types';

function record(
  source: string,
  ids: string,
  character: string,
  calibrationRole: CalibrationSourceRecord['calibrationRole'],
): CalibrationSourceRecord {
  return { source, sourceVersion: 'fixture', ids, character, calibrationRole };
}

describe('Calibration source corpus', () => {
  it('keeps primary and alternate samples separate and character-partitioned', () => {
    const result = buildCalibrationSourceCorpus([
      record('BabelStone IDS', '⿰木日', '東', 'primary-candidate'),
      record('Yi Bai IDS lv0', '⿰木月', '東', 'primary-candidate'),
      record('BabelStone IDS', '⿰木山', '東', 'alternate'),
      record('CHISE IDS database', '⿰木日', '東', 'diagnostic'),
      record('BabelStone IDS', '⿰木火', '甲', 'primary-candidate'),
      record('Yi Bai IDS lv0', '⿰木火', '乙', 'primary-candidate'),
    ]);

    expect(result.corpus.primary.train).toHaveLength(1);
    expect(result.corpus.alternate.train).toHaveLength(2);
    expect(result.corpus.primary.train[0]?.character).toBe('東');
    expect(result.corpus.alternate.train.every((sample) => sample.character === '東')).toBe(true);
    expect(result.corpus.diagnostics.some((sample) => sample.ids === '⿰木火' && sample.character === '甲')).toBe(true);
    expect(result.corpus.diagnostics.some((sample) => sample.ids === '⿰木火' && sample.character === '乙')).toBe(true);
    expect(result.report.stats.ambiguousIds).toBe(1);
  });

  it('does not treat Unified Known status as a Calibration role', () => {
    const result = buildCalibrationSourceCorpus([
      record('fixture', '⿰木日', '東', 'excluded'),
    ]);

    expect(result.corpus.primary.train).toEqual([]);
    expect(result.corpus.primary.holdout).toEqual([]);
    expect(result.corpus.excluded).toHaveLength(1);
  });
});
