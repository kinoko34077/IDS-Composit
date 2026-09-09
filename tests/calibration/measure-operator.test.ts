import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CALIBRATION_FONT_METRICS } from '../../tools/calibration/measurement-config';
import { buildOperatorCalibrationArtifact, runOperatorCalibration } from '../../tools/calibration/measure-operator';
import type { CalibrationCorpusSample } from '../../tools/calibration/generate-source-corpus';
import type { CalibrationCanvas } from '../../tools/calibration/rasterize';

function createCanvas(): CalibrationCanvas {
  const context = {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillText: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(160 * 160 * 4) })),
    font: '',
    textBaseline: '',
    fillStyle: '',
    globalAlpha: 0,
  };
  return { width: 0, height: 0, getContext: vi.fn(() => context) } as unknown as CalibrationCanvas;
}

function sample(ids: string, character: string, partition: 'train' | 'holdout'): CalibrationCorpusSample {
  return {
    ids,
    character,
    source: 'Yi Bai IDS lv0',
    sourceVersion: 'fixture',
    calibrationRole: 'primary-candidate',
    operator: '⿰',
    components: Array.from(ids).slice(1),
    partition,
  };
}

describe('operator calibration runner', () => {
  it('keeps the real measurement path tools-only and reports coverage/gate counts', () => {
    const sans = {
      id: 'sans', family: 'Source Han Sans JP', version: 'fixture', sha256: 'sha256:sans', fontPath: 'sans.otf',
      metrics: DEFAULT_CALIBRATION_FONT_METRICS,
      fontkitFont: { unitsPerEm: 1000, ascent: 880, descent: -120, hasGlyphForCodePoint: () => true },
      createCanvas,
    };
    const serif = {
      id: 'serif', family: 'Source Han Serif JP', version: 'fixture', sha256: 'sha256:serif', fontPath: 'serif.otf',
      metrics: DEFAULT_CALIBRATION_FONT_METRICS,
      fontkitFont: { unitsPerEm: 1000, ascent: 880, descent: -120, hasGlyphForCodePoint: () => true },
      createCanvas,
    };
    const result = runOperatorCalibration({
      train: [sample('⿰木可', '柯', 'train')],
      holdout: [sample('⿰日月', '明', 'holdout')],
    }, { operator: '⿰', sans, serif, maxTrainingSamples: 1, minTrain: 1, minHoldout: 1 });

    expect(result.summary.training).toMatchObject({ corpusSamples: 1, selectedSamples: 1, measuredSamples: 1, optimizedSamples: 1 });
    expect(result.summary.holdout).toMatchObject({ corpusSamples: 1, commonRasterEligibleSamples: 1, measuredSamples: 1 });
    expect(result.summary.fonts.sans.coverage.train).toMatchObject({ knownEligible: 1, fontSupported: 1, rasterEligible: 1 });
    expect(result.summary.gate.status).toBe('reject');
    expect(result.summary.profile).toBeNull();
  });

  it('emits a reproducible compact artifact without raw distribution evidence', () => {
    const sans = {
      id: 'sans', family: 'Source Han Sans JP', version: 'fixture', sha256: 'sha256:sans', fontPath: 'sans.otf',
      metrics: DEFAULT_CALIBRATION_FONT_METRICS,
      fontkitFont: { unitsPerEm: 1000, ascent: 880, descent: -120, hasGlyphForCodePoint: () => true },
      createCanvas,
    };
    const serif = {
      id: 'serif', family: 'Source Han Serif JP', version: 'fixture', sha256: 'sha256:serif', fontPath: 'serif.otf',
      metrics: DEFAULT_CALIBRATION_FONT_METRICS,
      fontkitFont: { unitsPerEm: 1000, ascent: 880, descent: -120, hasGlyphForCodePoint: () => true },
      createCanvas,
    };
    const result = runOperatorCalibration({
      train: [sample('⿰木可', '柯', 'train')],
      holdout: [sample('⿰日月', '明', 'holdout')],
    }, { operator: '⿰', sans, serif, maxTrainingSamples: 1, minTrain: 1, minHoldout: 1 });

    const artifact = buildOperatorCalibrationArtifact(result.summary, 'sha256:corpus');
    expect(artifact).toMatchObject({
      schemaVersion: 'ids-composit-operator-calibration-report/v0.2',
      sourceCorpusSha256: 'sha256:corpus',
      operator: '⿰',
    });
    expect('profileDistributions' in artifact).toBe(false);
  });
});
