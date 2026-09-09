import type { Resolution } from '../core/types';
import type { KnownCharacterIndex } from '../known';
import { parseIds } from '../parser';
import type { CharacterKnowledgeProvider, IdsMatchResult } from '../chise/types';

export type ResolveChainOptions = {
  explicitProvider?: CharacterKnowledgeProvider;
  knownIndex?: KnownCharacterIndex;
  chiseProvider?: CharacterKnowledgeProvider;
};

function diagnosticFrom(error: unknown): { kind: 'chise-unavailable'; message?: string } {
  return {
    kind: 'chise-unavailable',
    ...(error instanceof Error && error.message.length > 0 ? { message: error.message } : {}),
  };
}

function isNativeMatch(result: IdsMatchResult): result is Extract<IdsMatchResult, { found: true }> {
  return result.found === true && typeof result.text === 'string' && result.text.length > 0;
}

function composeResolution(
  ast: NonNullable<Extract<ReturnType<typeof parseIds>, { ok: true }>['ast']>,
  sourceIds: string,
  diagnostic?: ReturnType<typeof diagnosticFrom>,
): Resolution {
  return diagnostic === undefined ? { kind: 'compose', ast, sourceIds } : { kind: 'compose', ast, sourceIds, diagnostic };
}

async function resolveFromProvider(
  provider: CharacterKnowledgeProvider,
  ids: string,
): Promise<{ text?: string; diagnostic?: ReturnType<typeof diagnosticFrom> }> {
  try {
    const result = await provider.matchIds(ids);
    if (isNativeMatch(result)) return { text: result.text };
    if (result.found === false && 'unavailable' in result) return { diagnostic: diagnosticFrom(result.error) };
    return {};
  } catch (error) {
    return { diagnostic: diagnosticFrom(error) };
  }
}

export async function resolveIdsWithChain(ids: string, options: ResolveChainOptions = {}): Promise<Resolution> {
  const parsed = parseIds(ids);
  if (!parsed.ok) {
    return { kind: 'unresolved', sourceIds: ids, reason: parsed.error.message };
  }

  let diagnostic: ReturnType<typeof diagnosticFrom> | undefined;
  if (options.explicitProvider !== undefined) {
    const result = await resolveFromProvider(options.explicitProvider, ids);
    if (result.text !== undefined) return { kind: 'native', text: result.text, sourceIds: ids };
    diagnostic = result.diagnostic ?? diagnostic;
  }

  const known = options.knownIndex?.resolve(ids);
  if (known?.kind === 'match') {
    return { kind: 'native', text: known.character, sourceIds: ids };
  }

  if (options.chiseProvider !== undefined) {
    const result = await resolveFromProvider(options.chiseProvider, ids);
    if (result.text !== undefined) return { kind: 'native', text: result.text, sourceIds: ids };
    diagnostic = result.diagnostic ?? diagnostic;
  }

  return composeResolution(parsed.ast, ids, diagnostic);
}
