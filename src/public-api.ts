import './renderer/styles.css';
import type { CharacterKnowledgeProvider, ChiseProviderOptions } from './chise';
import { createChiseProvider } from './chise';
import { resolveIds } from './resolver';
import { renderIdsInElementAsync } from './renderer/dom-renderer';

export type RenderIdsOptions = {
  chise?: boolean;
  provider?: CharacterKnowledgeProvider;
  chiseOptions?: ChiseProviderOptions;
};

export async function renderIds(root: HTMLElement, options: RenderIdsOptions = {}): Promise<void> {
  const provider = options.provider ?? (options.chise === true ? createChiseProvider(options.chiseOptions) : undefined);
  await renderIdsInElementAsync(root, (ids) => resolveIds(ids, provider));
}

export type { CharacterKnowledgeProvider, ChiseProviderOptions, IdsMatchResult, MatchCache } from './chise';
