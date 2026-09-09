import type { KnownCharacterEntry } from '../../src/known/types';

export type ExternalKnownSource = {
  name: string;
  version: string;
  retrievalMethod: string;
  fileHash?: string;
  repository?: string;
  revision?: string;
  license?: string;
  files?: readonly string[];
};

export type ExternalKnownRecord = {
  ids: string;
  character: string;
  status: KnownCharacterEntry['status'];
  /** Source-specific metadata retained in bulk artifacts, not runtime entries. */
  variantTag?: string;
};

export type GeneratedKnownIndexArtifact = {
  schemaVersion: 'ids-composit-known-index/v0.2';
  source: ExternalKnownSource;
  entries: readonly KnownCharacterEntry[];
};

export type GeneratedKnownRecordsArtifact = {
  schemaVersion: 'ids-composit-known-records/v0.2';
  source: ExternalKnownSource;
  records: readonly ExternalKnownRecord[];
};

function requiredMetadata(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) throw new Error(`Known Index source ${field} must not be empty`);
  return normalized;
}

function requiredSourceValue(value: string, field: string): string {
  if (value.trim().length === 0) throw new Error(`Known Index source ${field} must not be empty`);
  return value;
}

function compareText(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareEntries(left: KnownCharacterEntry, right: KnownCharacterEntry): number {
  return compareText(`${left.ids}\u0000${left.character}\u0000${left.status}`, `${right.ids}\u0000${right.character}\u0000${right.status}`);
}

function compareRecords(left: ExternalKnownRecord, right: ExternalKnownRecord): number {
  return compareText(
    `${left.ids}\u0000${left.character}\u0000${left.status}\u0000${left.variantTag ?? ''}`,
    `${right.ids}\u0000${right.character}\u0000${right.status}\u0000${right.variantTag ?? ''}`,
  );
}

function normalizeSource(source: ExternalKnownSource): ExternalKnownSource {
  return {
    name: requiredMetadata(source.name, 'name'),
    version: requiredMetadata(source.version, 'version'),
    retrievalMethod: requiredMetadata(source.retrievalMethod, 'retrievalMethod'),
    ...(source.fileHash === undefined ? {} : { fileHash: requiredMetadata(source.fileHash, 'fileHash') }),
    ...(source.repository === undefined ? {} : { repository: requiredMetadata(source.repository, 'repository') }),
    ...(source.revision === undefined ? {} : { revision: requiredMetadata(source.revision, 'revision') }),
    ...(source.license === undefined ? {} : { license: requiredMetadata(source.license, 'license') }),
    ...(source.files === undefined ? {} : { files: source.files.map((file) => requiredMetadata(file, 'files')) }),
  };
}

/**
 * Convert externally obtained records into a deterministic, optional data
 * artifact. This tool does not fetch CHISE or import the artifact into runtime.
 */
export function generateKnownIndexArtifact(
  records: readonly ExternalKnownRecord[],
  source: ExternalKnownSource,
): GeneratedKnownIndexArtifact {
  const normalizedSource = normalizeSource(source);

  const entries = records.map((record): KnownCharacterEntry => ({
    ids: requiredSourceValue(record.ids, 'ids'),
    character: requiredSourceValue(record.character, 'character'),
    source: normalizedSource.name,
    sourceVersion: normalizedSource.version,
    retrievalMethod: normalizedSource.retrievalMethod,
    ...(normalizedSource.fileHash === undefined ? {} : { sourceHash: normalizedSource.fileHash }),
    status: record.status,
  })).sort(compareEntries);

  return {
    schemaVersion: 'ids-composit-known-index/v0.2',
    source: normalizedSource,
    entries,
  };
}

/**
 * Create a compact bulk artifact. Source provenance is stored once at the
 * artifact level; consumers can hydrate records into KnownCharacterEntry
 * values only when they explicitly opt into this optional dataset.
 */
export function generateKnownRecordsArtifact(
  records: readonly ExternalKnownRecord[],
  source: ExternalKnownSource,
): GeneratedKnownRecordsArtifact {
  const normalizedSource = normalizeSource(source);
  const normalizedRecords = records
    .map((record): ExternalKnownRecord => ({
      ids: requiredSourceValue(record.ids, 'ids'),
      character: requiredSourceValue(record.character, 'character'),
      status: record.status,
      ...(record.variantTag === undefined ? {} : { variantTag: requiredSourceValue(record.variantTag, 'variantTag') }),
    }))
    .sort(compareRecords);

  return {
    schemaVersion: 'ids-composit-known-records/v0.2',
    source: normalizedSource,
    records: normalizedRecords,
  };
}
