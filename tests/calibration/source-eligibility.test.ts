import { describe, expect, it } from 'vitest';
import { isCalibrationEligibleIds, isUnicodeScalar } from '../../tools/calibration/sources/common';

describe('Calibration IDS eligibility', () => {
  it('accepts a supported composition whose leaves are Unicode scalars', () => {
    expect(isCalibrationEligibleIds('⿰木日')).toBe(true);
    expect(isCalibrationEligibleIds('⿳日月山')).toBe(true);
  });

  it('rejects a leaf-only value, unsupported operators, and special components', () => {
    expect(isCalibrationEligibleIds('木')).toBe(false);
    expect(isCalibrationEligibleIds('⿾木')).toBe(false);
    expect(isCalibrationEligibleIds('⿰{1}日')).toBe(false);
    expect(isCalibrationEligibleIds('⿰木？')).toBe(false);
  });

  it('accepts supplementary Unicode scalars and rejects malformed scalar strings', () => {
    expect(isUnicodeScalar('𠀀')).toBe(true);
    expect(isUnicodeScalar('ab')).toBe(false);
    expect(isUnicodeScalar('\uD800')).toBe(false);
    expect(isUnicodeScalar('')).toBe(false);
  });
});
