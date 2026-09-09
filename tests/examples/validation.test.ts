/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderCalibrationComparison, type CalibrationReport } from '../../examples/validation';

const report: CalibrationReport = {
  operator: '⿰',
  training: { measuredSamples: 109 },
  holdout: { measuredSamples: 1619 },
  gate: {
    status: 'accept',
    reason: 'passed',
    sans: { baseline: { median: 0.14, p75: 0.15 }, candidate: { median: 0.11, p75: 0.12 } },
    serif: { baseline: { median: 0.15, p75: 0.17 }, candidate: { median: 0.13, p75: 0.15 } },
  },
  profile: { corpusVersion: 'v0.2-calibration-sans-jp', sampleCount: 109 },
};

describe('calibration comparison page', () => {
  it('renders native, fixed, calibrated views and gate metrics', async () => {
    const status = document.createElement('p');
    status.id = 'calibration-report-status';
    const container = document.createElement('div');
    document.body.append(status, container);

    await renderCalibrationComparison(container, async () => report);

    expect(container.querySelectorAll('.comparison-item')).toHaveLength(3);
    expect(container.textContent).toContain('Native');
    expect(container.textContent).toContain('v0.1 Fixed');
    expect(container.textContent).toContain('v0.2 Calibrated');
    expect(status.textContent).toContain('Gate: accept');
    expect(container.textContent).toContain('0.14000 → 0.11000');
  });
});
