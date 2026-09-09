export type KnownCharacterStatus = 'verified' | 'candidate';

export type KnownCharacterEntry = {
  ids: string;
  character: string;
  source: string;
  sourceVersion?: string;
  retrievalMethod?: string;
  sourceHash?: string;
  status: KnownCharacterStatus;
};

export type KnownCharacterArtifactSource = {
  name: string;
  version: string;
  retrievalMethod: string;
  fileHash?: string;
  repository?: string;
  revision?: string;
  license?: string;
  files?: readonly string[];
};

export type KnownCharacterRecordsArtifact = {
  schemaVersion: 'ids-composit-known-records/v0.2';
  source: KnownCharacterArtifactSource;
  records: readonly {
    ids: string;
    character: string;
    status: KnownCharacterStatus;
    /** Optional source-specific annotation; ignored by the runtime index. */
    variantTag?: string;
  }[];
};

export type KnownCharacterMergedRecordsArtifact = {
  schemaVersion: 'ids-composit-known-records-merged/v0.2';
  sources: readonly KnownCharacterArtifactSource[];
  records: readonly {
    ids: string;
    character: string;
    status: KnownCharacterStatus;
    sourceIndexes: readonly number[];
  }[];
};

export type KnownCharacterLookup =
  | { kind: 'match'; character: string }
  | { kind: 'ambiguous' }
  | { kind: 'miss' };

export interface KnownCharacterIndex {
  lookupIds(ids: string): readonly KnownCharacterEntry[];
  lookupCharacter(character: string): readonly KnownCharacterEntry[];
  resolve(ids: string): KnownCharacterLookup;
}
