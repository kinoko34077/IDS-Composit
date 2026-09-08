import type { Box, LayoutNode } from '../core/types';
import { composeLayout } from '../composition';
import { parseIds, scanEmbeddedIds, type TextSegment } from '../parser';

const ROOT_BOX: Box = { x: 0, y: 0, width: 1, height: 1 };
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);

function setRelativeBoxStyle(element: HTMLElement, box: Box, parentBox: Box): void {
  const parentWidth = parentBox.width || 1;
  const parentHeight = parentBox.height || 1;
  element.style.position = 'absolute';
  element.style.left = `${((box.x - parentBox.x) / parentWidth) * 100}%`;
  element.style.top = `${((box.y - parentBox.y) / parentHeight) * 100}%`;
  element.style.width = `${(box.width / parentWidth) * 100}%`;
  element.style.height = `${(box.height / parentHeight) * 100}%`;
  element.style.transformOrigin = 'top left';
}

function renderNode(node: LayoutNode, document: Document, parentBox: Box): HTMLElement {
  const element = document.createElement('span');
  setRelativeBoxStyle(element, node.box, parentBox);
  element.style.overflow = 'visible';

  if (node.type === 'glyph') {
    element.className = 'ids-part';
    element.dataset.role = node.role;
    const content = document.createElement('span');
    content.className = 'ids-glyph-content';
    content.style.display = 'inline-block';
    content.style.width = '1em';
    content.style.height = '1em';
    content.style.lineHeight = '1';
    content.style.transformOrigin = 'top left';
    content.style.transform = `scale(${node.box.width / (parentBox.width || 1)}, ${node.box.height / (parentBox.height || 1)})`;
    content.textContent = node.value;
    element.append(content);
    return element;
  }

  element.className = 'ids-composition';
  element.dataset.operator = node.operator;
  for (const child of node.children) {
    element.append(renderNode(child, document, node.box));
  }
  return element;
}

export function renderLayout(layout: LayoutNode, document: Document, source: string): HTMLSpanElement {
  const root = document.createElement('span');
  root.className = 'ids-inline-glyph';
  root.dataset.ids = source;
  root.style.display = 'inline-block';
  root.style.position = 'relative';
  root.style.width = '1em';
  root.style.height = '1em';
  root.style.overflow = 'hidden';
  root.setAttribute('aria-label', source);
  root.append(renderNode(layout, document, ROOT_BOX));
  return root;
}

function collectTextNodes(node: Node, textNodes: Text[]): void {
  if (node.nodeType === Node.ELEMENT_NODE && SKIPPED_TAGS.has((node as Element).tagName)) {
    return;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    textNodes.push(node as Text);
    return;
  }
  for (const child of Array.from(node.childNodes)) {
    collectTextNodes(child, textNodes);
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

export function renderIdsInElement(root: HTMLElement): void {
  const textNodes: Text[] = [];
  collectTextNodes(root, textNodes);

  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    if (parent === null) continue;
    const segments = scanEmbeddedIds(textNode.data);
    if (segments.length === 1 && segments[0]?.type === 'text') continue;

    const fragment = textNode.ownerDocument.createDocumentFragment();
    for (const segment of segments) {
      appendSegment(fragment, segment, textNode.ownerDocument);
    }
    parent.replaceChild(fragment, textNode);
  }
}
