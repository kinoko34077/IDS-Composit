/**
 * Normalize only keys used by the Known Index. The original IDS remains on
 * each entry for provenance and is never replaced by this value.
 *
 * NFC is intentionally the only normalization here. Structural or semantic
 * IDS canonicalization belongs to neither the Known Index nor this lookup.
 */
export function normalizeKnownLookupKey(value: string): string {
  return value.normalize('NFC');
}
