import type { KnownCharacterEntry } from '../../src/known/types';

export type ExternalKnownSource = {
  name: string;
  version: string;
  retrievalMethod: string;
  fileHash?: string;
};

export type ExternalKnownRecord = {
  ids: string;
  character: string;
  status: KnownCharacterEntry['status'];
};

export type GeneratedKnownIndexArtifact = {
  schemaVersion: 'ids-composit-known-index/v0.2';
  source: ExternalKnownSource;
  entries: readonly KnownCharacterEntry[];
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

/**
 * Convert externally obtained records into a deterministic, optional data
 * artifact. This tool does not fetch CHISE or import the artifact into runtime.
 */
export function generateKnownIndexArtifact(
  records: readonly ExternalKnownRecord[],
  source: ExternalKnownSource,
): GeneratedKnownIndexArtifact {
  const normalizedSource: ExternalKnownSource = {
    name: requiredMetadata(source.name, 'name'),
    version: requiredMetadata(source.version, 'version'),
    retrievalMethod: requiredMetadata(source.retrievalMethod, 'retrievalMethod'),
    ...(source.fileHash === undefined ? {} : { fileHash: requiredMetadata(source.fileHash, 'fileHash') }),
  };

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
