import './renderer/styles.css';
import type { CharacterKnowledgeProvider, ChiseProviderOptions } from './chise';
import { createChiseProvider } from './chise';
import { resolveIds } from './resolver';
import { renderIdsInElementAsync, type IdsResolver } from './renderer/dom-renderer';

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

export type IdsObserverHandle = {
  stop(): void;
};

function hasEditableAncestor(element: Element, root: HTMLElement): boolean {
  let current: Element | null = element;
  while (current !== null) {
    if (current.hasAttribute('contenteditable') && current.getAttribute('contenteditable')?.toLowerCase() !== 'false') return true;
    if (current === root) break;
    current = current.parentElement;
  }
  return false;
}

function mutationTarget(node: Node): HTMLElement | null {
  if (node.nodeType === Node.ELEMENT_NODE) return node as HTMLElement;
  return node.parentElement;
}

export function observeIds(root: HTMLElement, options: RenderIdsOptions = {}): IdsObserverHandle {
  if (typeof MutationObserver === 'undefined') {
    throw new Error('MutationObserver is unavailable in this environment');
  }

  const resolve = createResolver(options);
  const includeContentEditable = options.contentEditable === true;
  let active = true;
  let queue = Promise.resolve();
  const enqueue = (target: HTMLElement | null): void => {
    if (target === null || target.classList.contains('ids-inline-glyph')) return;
    if (target !== root && !root.contains(target)) return;
    if (!includeContentEditable && hasEditableAncestor(target, root)) return;
    queue = queue.then(async () => {
      if (!active) return;
      await renderIdsInElementAsync(target, resolve, {
        includeContentEditable,
        maxConcurrency: options.maxConcurrency,
      });
    }).catch(() => undefined);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        const target = mutationTarget(node);
        if (target?.closest('.ids-inline-glyph') !== null) continue;
        enqueue(target);
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  enqueue(root);

  return {
    stop() {
      if (!active) return;
      active = false;
      observer.disconnect();
    },
  };
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
