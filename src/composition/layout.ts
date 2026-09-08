import type { Box, IdsNode, LayoutNode, StructuralRole } from '../core/types';
import { LAYOUT_TEMPLATES, type LayoutTemplateChild } from '../data/layout-templates';
import { VARIANT_MAP, type VariantMap } from '../data/variants';
import { resolveVariant } from '../variants';

const ROOT_BOX: Box = { x: 0, y: 0, width: 1, height: 1 };

function placeBox(parent: Box, child: LayoutTemplateChild): Box {
  return {
    x: parent.x + child.x * parent.width,
    y: parent.y + child.y * parent.height,
    width: child.width * parent.width,
    height: child.height * parent.height,
  };
}

export type ComposeOptions = {
  variantMap?: VariantMap;
};

function composeNode(ast: IdsNode, box: Box, role: StructuralRole | undefined, options: ComposeOptions): LayoutNode {
  if (ast.type === 'char') {
    const value = role === undefined ? ast.value : resolveVariant(ast.value, role, options.variantMap ?? VARIANT_MAP);
    return { type: 'glyph', value, ...(role === undefined ? {} : { role }), box };
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
      return composeNode(child, placeBox(box, slot), slot.role, options);
    }),
  };
}

export function composeLayout(ast: IdsNode, options: ComposeOptions = {}): LayoutNode {
  return composeNode(ast, ROOT_BOX, undefined, options);
}
