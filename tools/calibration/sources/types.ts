/**
 * Calibration-only source vocabulary. These roles describe suitability for
 * glyph measurement and are intentionally unrelated to Known Index status.
 */
export type CalibrationSourceRole =
  | 'primary-candidate'
  | 'alternate'
  | 'diagnostic'
  | 'excluded';

export type CalibrationSourceRecord = {
  ids: string;
  character: string;
  source: string;
  sourceVersion?: string;
  sourceHash?: string;
  region?: string;
  variantRole?: string;
  sourceRecordId?: string;
  calibrationRole: CalibrationSourceRole;
};
