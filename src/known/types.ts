export type KnownCharacterStatus = 'verified' | 'candidate';

export type KnownCharacterEntry = {
  ids: string;
  character: string;
  source: string;
  sourceVersion?: string;
  status: KnownCharacterStatus;
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
