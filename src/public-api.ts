import './renderer/styles.css';
import type { CharacterKnowledgeProvider, ChiseProviderOptions } from './chise';
import { createChiseProvider } from './chise';
import { DEFAULT_KNOWN_CHARACTER_INDEX } from './known/default';
import type { KnownCharacterIndex } from './known';
import type { LayoutProfile } from './calibration';
import { resolveIdsWithChain } from './resolver';
import { renderIdsInElement, renderIdsInElementAsync } from './renderer/render-document';
import { observeIdsInElement, type IdsObserverHandle } from './runtime/observe-dom';
import type { IdsResolver } from './runtime/resolve-batch';

export type { IdsObserverHandle } from './runtime/observe-dom';

export type RenderIdsOptions = {
  chise?: boolean;
  provider?: CharacterKnowledgeProvider;
  knownIndex?: KnownCharacterIndex;
  layoutProfiles?: Readonly<Record<string, LayoutProfile>>;
  chiseOptions?: ChiseProviderOptions;
  contentEditable?: boolean;
  maxConcurrency?: number;
};

function createResolver(options: RenderIdsOptions): IdsResolver {
  const knownIndex = options.knownIndex ?? DEFAULT_KNOWN_CHARACTER_INDEX;
  const explicitProvider = options.provider;
  const chiseProvider = explicitProvider === undefined && options.chise === true
    ? createChiseProvider(options.chiseOptions)
    : undefined;
  return (ids) => resolveIdsWithChain(ids, { explicitProvider, knownIndex, chiseProvider });
}

function createRenderTarget(options: RenderIdsOptions): (target: HTMLElement) => Promise<void> {
  const includeContentEditable = options.contentEditable === true;
  if (options.provider === undefined && options.knownIndex === undefined && options.chise !== true) {
    return async (target) => {
      renderIdsInElement(target, {
        includeContentEditable,
        knownIndex: DEFAULT_KNOWN_CHARACTER_INDEX,
        layoutProfiles: options.layoutProfiles,
      });
    };
  }

  const resolve = createResolver(options);
  return (target) => renderIdsInElementAsync(target, resolve, {
    includeContentEditable,
    maxConcurrency: options.maxConcurrency,
    knownIndex: options.knownIndex ?? DEFAULT_KNOWN_CHARACTER_INDEX,
    layoutProfiles: options.layoutProfiles,
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
export { createKnownCharacterIndex } from './known';
export type {
  KnownCharacterEntry,
  KnownCharacterIndex,
  KnownCharacterLookup,
  KnownCharacterStatus,
} from './known';
export type { LayoutProfile } from './calibration';
export type {
  CharacterKnowledgeProvider,
  ChiseProviderOptions,
  IdsMatchResult,
  MatchCache,
  MemoryMatchCache,
  MemoryMatchCacheOptions,
} from './chise';
