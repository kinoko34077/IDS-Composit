import { describe, expect, it } from 'vitest';
import { selectCalibrationSamples } from '../../tools/calibration/sampling-policy';

describe('multi-source calibration sampling policy', () => {
  it('selects one primary IDS per character and keeps alternates separate', () => {
    const result = selectCalibrationSamples([
      { ids: '⿲彳圭亍', character: '街', source: 'BabelStone IDS', status: 'verified' },
      { ids: '⿴行圭', character: '街', source: 'CHISE IDS database', status: 'verified' },
      { ids: '⿴行圭', character: '街', source: 'Yi Bai IDS lv2', status: 'verified' },
      { ids: '⿰木可', character: '柯', source: 'CHISE IDS database', status: 'candidate' },
    ]);

    expect(result.primary.map((entry) => [entry.character, entry.ids])).toEqual([
      ['街', '⿴行圭'],
    ]);
    expect(result.primary[0]?.sampleRole).toBe('primary');
    expect(result.alternate.map((entry) => [entry.source, entry.ids])).toEqual([
      ['BabelStone IDS', '⿲彳圭亍'],
    ]);
    expect(result.alternate.every((entry) => entry.sampleRole === 'alternate')).toBe(true);
  });

  it('deduplicates normalized duplicate pairs without inventing a canonical IDS', () => {
    const result = selectCalibrationSamples([
      { ids: '⿰が木', character: '字', source: 'BabelStone IDS', status: 'verified' },
      { ids: '⿰が木', character: '字', source: 'BabelStone IDS', status: 'verified' },
    ]);

    expect(result.primary).toHaveLength(1);
    expect(result.primary[0]?.ids).toBe('⿰が木');
    expect(result.alternate).toHaveLength(0);
  });

  it('treats a corroborated CHISE entry as CHISE-priority for baseline sampling', () => {
    const result = selectCalibrationSamples([
      { ids: '⿲彳圭亍', character: '街', source: 'BabelStone IDS', status: 'verified' },
      { ids: '⿴行圭', character: '街', source: 'CHISE IDS database + Yi Bai IDS lv2', status: 'verified' },
      { ids: '⿰徍亍', character: '街', source: 'Yi Bai IDS lv2', status: 'verified' },
    ]);

    expect(result.primary[0]?.ids).toBe('⿴行圭');
    expect(result.alternate.map((entry) => entry.ids)).toEqual(['⿲彳圭亍', '⿰徍亍']);
  });
});
