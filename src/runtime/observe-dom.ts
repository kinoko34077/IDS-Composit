export type ObserveIdsOptions = {
  includeContentEditable?: boolean;
  render: (target: HTMLElement) => Promise<void>;
};

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

function elementForNode(node: Node): Element | null {
  if (node.nodeType === Node.ELEMENT_NODE) return node as Element;
  return node.parentElement;
}

function mutationTarget(mutation: MutationRecord): HTMLElement | null {
  if (mutation.target.nodeType === Node.ELEMENT_NODE) return mutation.target as HTMLElement;
  return mutation.addedNodes[0]?.parentElement ?? null;
}

function hasNonGlyphAddition(mutation: MutationRecord): boolean {
  return Array.from(mutation.addedNodes).some((node) => {
    const element = elementForNode(node);
    return element?.closest('.ids-inline-glyph') === null;
  });
}

function collectMutationTargets(
  mutations: MutationRecord[],
  root: HTMLElement,
  includeContentEditable: boolean,
): HTMLElement[] {
  const targets: HTMLElement[] = [];
  for (const mutation of mutations) {
    if (!hasNonGlyphAddition(mutation)) continue;
    const target = mutationTarget(mutation);
    if (target === null || target.classList.contains('ids-inline-glyph')) continue;
    if (target !== root && !root.contains(target)) continue;
    if (!includeContentEditable && hasEditableAncestor(target, root)) continue;
    if (targets.some((existing) => existing.contains(target))) continue;
    for (let index = targets.length - 1; index >= 0; index -= 1) {
      const existing = targets[index];
      if (existing !== undefined && target.contains(existing)) targets.splice(index, 1);
    }
    targets.push(target);
  }
  return targets;
}

export function observeIdsInElement(root: HTMLElement, options: ObserveIdsOptions): IdsObserverHandle {
  if (typeof MutationObserver === 'undefined') {
    throw new Error('MutationObserver is unavailable in this environment');
  }

  const includeContentEditable = options.includeContentEditable === true;
  let active = true;
  let queue = Promise.resolve();
  const enqueue = (target: HTMLElement | null): void => {
    if (target === null || target.classList.contains('ids-inline-glyph')) return;
    if (target !== root && !root.contains(target)) return;
    if (!includeContentEditable && hasEditableAncestor(target, root)) return;
    queue = queue.then(async () => {
      if (!active) return;
      await options.render(target);
    }).catch(() => undefined);
  };

  const observer = new MutationObserver((mutations) => {
    for (const target of collectMutationTargets(mutations, root, includeContentEditable)) enqueue(target);
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
