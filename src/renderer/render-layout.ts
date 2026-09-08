import type { Box, LayoutNode } from '../core/types';
import { applyGlyphAccessibility, hideInternalAccessibility } from './accessibility';
import { attachRootCopyHandler, installDocumentCopyHandler } from './copy-behavior';
import { IDS_GLYPH_CLASS } from './render-constants';

const ROOT_BOX: Box = { x: 0, y: 0, width: 1, height: 1 };

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
  hideInternalAccessibility(element);
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
    // Layout boxes are absolute in the root 0..1 coordinate space. The glyph
    // content starts at a root-sized 1em, so its scale must use the absolute
    // box dimensions rather than the immediate parent's relative dimensions.
    content.style.transform = `scale(${node.box.width}, ${node.box.height})`;
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
  installDocumentCopyHandler(document);
  const root = document.createElement('span');
  root.className = IDS_GLYPH_CLASS;
  root.dataset.ids = source;
  root.style.display = 'inline-block';
  root.style.position = 'relative';
  root.style.width = '1em';
  root.style.height = '1em';
  root.style.overflow = 'hidden';
  applyGlyphAccessibility(root, source);
  attachRootCopyHandler(root, source);
  root.append(renderNode(layout, document, ROOT_BOX));
  return root;
}
