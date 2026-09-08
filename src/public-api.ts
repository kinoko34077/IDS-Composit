import './renderer/styles.css';
import type { CharacterKnowledgeProvider, ChiseProviderOptions } from './chise';
import { createChiseProvider } from './chise';
import { resolveIds } from './resolver';
import { renderIdsInElementAsync } from './renderer/render-document';
import { observeIdsInElement, type IdsObserverHandle } from './runtime/observe-dom';
import type { IdsResolver } from './runtime/resolve-batch';

export type { IdsObserverHandle } from './runtime/observe-dom';

export type RenderIdsOptions = {
  chise?: boolean;
  provider?: CharacterKnowledgeProvider;
  chiseOptions?: ChiseProviderOptions;
  contentEditable?: boolean;
  maxConcurrency?: number;
};

function createResolver(options: RenderIdsOptions): IdsResolver {
  const provider = options.provider ?? (options.chise === true ? createChiseProvider(options.chiseOptions) : undefined);
  return (ids) => resolveIds(ids, provider);
}

export async function renderIds(root: HTMLElement, options: RenderIdsOptions = {}): Promise<void> {
  await renderIdsInElementAsync(root, createResolver(options), {
    includeContentEditable: options.contentEditable === true,
    maxConcurrency: options.maxConcurrency,
  });
}

export function observeIds(root: HTMLElement, options: RenderIdsOptions = {}): IdsObserverHandle {
  return observeIdsInElement(root, {
    resolve: createResolver(options),
    includeContentEditable: options.contentEditable === true,
    maxConcurrency: options.maxConcurrency,
  });
}

export { createMemoryMatchCache } from './chise';
export type {
  CharacterKnowledgeProvider,
  ChiseProviderOptions,
  IdsMatchResult,
  MatchCache,
  MemoryMatchCache,
  MemoryMatchCacheOptions,
} from './chise';
