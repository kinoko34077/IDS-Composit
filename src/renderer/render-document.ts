import type { Resolution } from '../core/types';
import { composeLayout } from '../composition';
import { parseIds, scanEmbeddedIds, type TextSegment } from '../parser';
import { resolveUniqueIds, type IdsResolver } from '../runtime/resolve-batch';
import { IDS_GLYPH_CLASS, SKIPPED_TAGS } from './render-constants';
import { renderLayout } from './render-layout';

export type RenderIdsInElementOptions = {
  includeContentEditable?: boolean;
  maxConcurrency?: number;
};

function isContentEditable(element: Element): boolean {
  return element.hasAttribute('contenteditable') && element.getAttribute('contenteditable')?.toLowerCase() !== 'false';
}

function collectTextNodes(node: Node, textNodes: Text[], includeContentEditable: boolean): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    if (SKIPPED_TAGS.has(element.tagName) || element.classList.contains(IDS_GLYPH_CLASS)) {
      return;
    }
    if (!includeContentEditable && isContentEditable(element)) {
      return;
    }
  }
  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node as Text);
    return;
  }
  for (const child of Array.from(node.childNodes)) {
    collectTextNodes(child, textNodes, includeContentEditable);
  }
}

function appendSegment(fragment: DocumentFragment, segment: TextSegment, document: Document): void {
  if (segment.type === 'text' || segment.type === 'invalid') {
    fragment.append(document.createTextNode(segment.type === 'text' ? segment.value : segment.raw));
    return;
  }

  try {
    const parsed = parseIds(segment.source);
    if (!parsed.ok) {
      fragment.append(document.createTextNode(segment.raw));
      return;
    }
    fragment.append(renderLayout(composeLayout(parsed.ast), document, segment.source));
  } catch {
    fragment.append(document.createTextNode(segment.raw));
  }
}

function appendResolution(fragment: DocumentFragment, resolution: Resolution, document: Document, raw: string): void {
  if (resolution.kind === 'native') {
    fragment.append(document.createTextNode(resolution.text));
    return;
  }
  if (resolution.kind === 'compose') {
    fragment.append(renderLayout(composeLayout(resolution.ast), document, resolution.sourceIds));
    return;
  }
  fragment.append(document.createTextNode(raw));
}

export function renderIdsInElement(root: HTMLElement, options: RenderIdsInElementOptions = {}): void {
  const textNodes: Text[] = [];
  collectTextNodes(root, textNodes, options.includeContentEditable === true);

  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    if (parent === null) continue;
    const segments = scanEmbeddedIds(textNode.data);
    if (!segments.some((segment) => segment.type === 'ids')) continue;

    const fragment = textNode.ownerDocument.createDocumentFragment();
    for (const segment of segments) {
      appendSegment(fragment, segment, textNode.ownerDocument);
    }
    parent.replaceChild(fragment, textNode);
  }
}

export async function renderIdsInElementAsync(
  root: HTMLElement,
  resolve: IdsResolver,
  options: RenderIdsInElementOptions = {},
): Promise<void> {
  const textNodes: Text[] = [];
  collectTextNodes(root, textNodes, options.includeContentEditable === true);
  const scannedNodes = textNodes
    .map((textNode) => ({ textNode, segments: scanEmbeddedIds(textNode.data) }))
    .filter(({ segments }) => segments.some((segment) => segment.type === 'ids'));
  const ids = scannedNodes.flatMap(({ segments }) => segments
    .filter((segment): segment is Extract<TextSegment, { type: 'ids' }> => segment.type === 'ids')
    .map((segment) => segment.source));
  const resolutions = await resolveUniqueIds(ids, resolve, options.maxConcurrency);

  for (const { textNode, segments } of scannedNodes) {
    const parent = textNode.parentNode;
    if (parent === null) continue;

    const fragment = textNode.ownerDocument.createDocumentFragment();
    for (const segment of segments) {
      if (segment.type === 'text' || segment.type === 'invalid') {
        fragment.append(textNode.ownerDocument.createTextNode(segment.type === 'text' ? segment.value : segment.raw));
        continue;
      }
      const resolution = resolutions.get(segment.source);
      if (resolution === undefined) {
        fragment.append(textNode.ownerDocument.createTextNode(segment.raw));
      } else {
        appendResolution(fragment, resolution, textNode.ownerDocument, segment.raw);
      }
    }
    parent.replaceChild(fragment, textNode);
  }
}

export type { IdsResolver } from '../runtime/resolve-batch';
