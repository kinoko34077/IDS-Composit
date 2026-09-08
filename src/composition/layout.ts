import type { Box, IdsNode, LayoutNode, StructuralRole } from '../core/types';
import { LAYOUT_TEMPLATES, type LayoutTemplateChild } from '../data/layout-templates';

const ROOT_BOX: Box = { x: 0, y: 0, width: 1, height: 1 };

function placeBox(parent: Box, child: LayoutTemplateChild): Box {
  return {
    x: parent.x + child.x * parent.width,
    y: parent.y + child.y * parent.height,
    width: child.width * parent.width,
    height: child.height * parent.height,
  };
}

function composeNode(ast: IdsNode, box: Box, role?: StructuralRole): LayoutNode {
  if (ast.type === 'char') {
    return { type: 'glyph', value: ast.value, ...(role === undefined ? {} : { role }), box };
  }

  const template = LAYOUT_TEMPLATES[ast.operator];
  if (template === undefined) {
    throw new Error(`Unsupported IDS operator: ${ast.operator}`);
  }
  if (template.length !== ast.children.length) {
    throw new Error(`IDS operator ${ast.operator} requires ${template.length} children`);
  }

  return {
    type: 'composition',
    operator: ast.operator,
    box,
    children: ast.children.map((child, index) => {
      const slot = template[index];
      if (slot === undefined) {
        throw new Error(`Missing layout slot for IDS operator: ${ast.operator}`);
      }
      return composeNode(child, placeBox(box, slot), slot.role);
    }),
  };
}

export function composeLayout(ast: IdsNode): LayoutNode {
  return composeNode(ast, ROOT_BOX);
}
