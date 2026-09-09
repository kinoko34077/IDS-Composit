import { describe, expect, it } from 'vitest';
import { evaluateOperatorGate } from '../../tools/calibration/gate';

const passingInput = {
  trainCount: 100,
  holdoutCount: 25,
  baselineSans: [0.4, 0.5, 0.6, 0.7],
  candidateSans: [0.2, 0.3, 0.6, 0.7],
  baselineSerif: [0.4, 0.5, 0.6, 0.7],
  candidateSerif: [0.4, 0.5, 0.6, 0.7],
};

describe('operator calibration gate', () => {
  it('accepts only when Sans improves and both fonts do not regress at p75', () => {
    const result = evaluateOperatorGate(passingInput);

    expect(result.status).toBe('accept');
    expect(result.sans.baseline.median).toBe(0.55);
    expect(result.sans.candidate.median).toBeCloseTo(0.45, 10);
    expect(result.serif.candidate.p75).toBe(result.serif.baseline.p75);
  });

  it('rejects a candidate that passes Sans but regresses Serif', () => {
    const result = evaluateOperatorGate({
      ...passingInput,
      candidateSerif: [0.4, 0.5, 0.8, 0.9],
    });

    expect(result.status).toBe('reject');
    expect(result.reason).toBe('serif-regression');
  });

  it('reports insufficient samples separately from a rejected profile', () => {
    const result = evaluateOperatorGate({
      ...passingInput,
      trainCount: 79,
      holdoutCount: 19,
    });

    expect(result.status).toBe('insufficient-samples');
    expect(result.reason).toBe('insufficient-samples');
  });

  it('does not invent an absolute loss threshold', () => {
    const result = evaluateOperatorGate({
      ...passingInput,
      baselineSans: [10, 11, 12, 13],
      candidateSans: [9, 10, 12, 13],
      baselineSerif: [10, 11, 12, 13],
      candidateSerif: [10, 11, 12, 13],
    });

    expect(result.status).toBe('accept');
  });
});
