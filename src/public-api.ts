import './renderer/styles.css';
import type { CharacterKnowledgeProvider, ChiseProviderOptions } from './chise';
import { createChiseProvider } from './chise';
import { resolveIds } from './resolver';
import { renderIdsInElement, renderIdsInElementAsync } from './renderer/render-document';
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

function createProvider(options: RenderIdsOptions): CharacterKnowledgeProvider | undefined {
  return options.provider ?? (options.chise === true ? createChiseProvider(options.chiseOptions) : undefined);
}

function createResolver(provider: CharacterKnowledgeProvider | undefined): IdsResolver {
  return (ids) => resolveIds(ids, provider);
}

function createRenderTarget(options: RenderIdsOptions): (target: HTMLElement) => Promise<void> {
  const includeContentEditable = options.contentEditable === true;
  const provider = createProvider(options);
  if (provider === undefined) {
    return async (target) => {
      renderIdsInElement(target, { includeContentEditable });
    };
  }

  const resolve = createResolver(provider);
  return (target) => renderIdsInElementAsync(target, resolve, {
    includeContentEditable,
    maxConcurrency: options.maxConcurrency,
  });
}

export async function renderIds(root: HTMLElement, options: RenderIdsOptions = {}): Promise<void> {
  await createRenderTarget(options)(root);
}

export function observeIds(root: HTMLElement, options: RenderIdsOptions = {}): IdsObserverHandle {
  return observeIdsInElement(root, {
    render: createRenderTarget(options),
    includeContentEditable: options.contentEditable === true,
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
