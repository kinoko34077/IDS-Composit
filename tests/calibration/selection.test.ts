import { describe, expect, it } from 'vitest';
import { selectCalibrationRecords } from '../../tools/calibration/select';
import type { CalibrationSourceRecord } from '../../tools/calibration/sources/types';

function record(
  source: string,
  ids: string,
  character: string,
  calibrationRole: CalibrationSourceRecord['calibrationRole'],
  variantRole = 'primary',
): CalibrationSourceRecord {
  return {
    source,
    sourceVersion: 'fixture',
    ids,
    character,
    variantRole,
    calibrationRole,
  };
}

describe('Calibration record selection', () => {
  it('removes ambiguous IDS mappings from training but retains them as diagnostics', () => {
    const selection = selectCalibrationRecords([
      record('BabelStone IDS', '⿰木日', '東', 'primary-candidate'),
      record('Yi Bai IDS lv0', '⿰木日', '柬', 'primary-candidate'),
      record('CHISE IDS database', '⿰木月', '東', 'diagnostic', 'functional'),
      record('BabelStone IDS', '⿰木月', '柬', 'alternate', 'X'),
    ]);

    expect(selection.ambiguousIds).toEqual(['⿰木日', '⿰木月']);
    expect(selection.training).toEqual([]);
    expect(selection.alternates).toEqual([]);
    expect(selection.diagnostics).toHaveLength(4);
    expect(selection.diagnostics.every((item) => item.calibrationRole === 'diagnostic')).toBe(true);
  });

  it('chooses one primary per character by source priority then IDS order', () => {
    const selection = selectCalibrationRecords([
      record('Yi Bai IDS lv0', '⿰木山', '東', 'primary-candidate'),
      record('CHISE IDS database', '⿰木月', '東', 'primary-candidate'),
      record('BabelStone IDS', '⿰木日', '東', 'primary-candidate'),
      record('BabelStone IDS', '⿰木川', '東', 'primary-candidate'),
      record('BabelStone IDS', '⿰木火', '東', 'alternate', 'X'),
    ]);

    expect(selection.training.map(({ source, ids }) => ({ source, ids }))).toEqual([
      { source: 'BabelStone IDS', ids: '⿰木川' },
    ]);
    expect(selection.alternates.map(({ source, ids }) => ({ source, ids }))).toEqual([
      { source: 'Yi Bai IDS lv0', ids: '⿰木山' },
      { source: 'BabelStone IDS', ids: '⿰木日' },
      { source: 'CHISE IDS database', ids: '⿰木月' },
      { source: 'BabelStone IDS', ids: '⿰木火' },
    ]);
  });

  it('keeps excluded records auditable and never promotes alternate-only data', () => {
    const excluded = record('BabelStone IDS', '⿰{1}日', '香', 'excluded');
    const alternate = record('BabelStone IDS', '⿰木日', '香', 'alternate', 'X');
    const selection = selectCalibrationRecords([excluded, alternate]);

    expect(selection.training).toEqual([]);
    expect(selection.alternates).toEqual([alternate]);
    expect(selection.excluded).toEqual([excluded]);
  });
});
