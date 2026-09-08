import type { Resolution } from '../core/types';
import { parseIds } from '../parser';
import type { CharacterKnowledgeProvider, IdsMatchResult } from '../chise/types';

function diagnosticFrom(error: unknown): { kind: 'chise-unavailable'; message?: string } {
  return {
    kind: 'chise-unavailable',
    ...(error instanceof Error && error.message.length > 0 ? { message: error.message } : {}),
  };
}

function composeResolution(ast: NonNullable<Extract<ReturnType<typeof parseIds>, { ok: true }>['ast']>, sourceIds: string, diagnostic?: ReturnType<typeof diagnosticFrom>): Resolution {
  return diagnostic === undefined ? { kind: 'compose', ast, sourceIds } : { kind: 'compose', ast, sourceIds, diagnostic };
}

function isNativeMatch(result: IdsMatchResult): result is Extract<IdsMatchResult, { found: true }> {
  return result.found === true && typeof result.text === 'string' && result.text.length > 0;
}

export async function resolveIds(ids: string, provider?: CharacterKnowledgeProvider): Promise<Resolution> {
  const parsed = parseIds(ids);
  if (!parsed.ok) {
    return { kind: 'unresolved', sourceIds: ids, reason: parsed.error.message };
  }

  if (provider === undefined) {
    return composeResolution(parsed.ast, ids);
  }

  try {
    const result = await provider.matchIds(ids);
    if (isNativeMatch(result)) {
      return { kind: 'native', text: result.text, sourceIds: ids };
    }
    if (result.found === false && 'unavailable' in result) {
      return composeResolution(parsed.ast, ids, diagnosticFrom(result.error));
    }
    return composeResolution(parsed.ast, ids);
  } catch (error) {
    return composeResolution(parsed.ast, ids, diagnosticFrom(error));
  }
}
