import type { Resolution } from '../core/types';
import type { CharacterKnowledgeProvider } from '../chise/types';
import type { KnownCharacterIndex } from '../known';
import { resolveIdsWithChain } from './resolve-chain';

export async function resolveIds(
  ids: string,
  provider?: CharacterKnowledgeProvider,
  knownIndex?: KnownCharacterIndex,
): Promise<Resolution> {
  return resolveIdsWithChain(ids, { explicitProvider: provider, knownIndex });
}
