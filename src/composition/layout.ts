import type { Box, IdsNode, LayoutNode, StructuralRole } from '../core/types.ts';
import type { LayoutProfile } from '../calibration/index.ts';
import { LAYOUT_TEMPLATES, type LayoutTemplateChild } from '../data/layout-templates.ts';
import { VARIANT_MAP, type VariantMap } from '../data/variants.ts';
import { resolveVariant } from '../variants/index.ts';
import { getChildRoles } from './roles.ts';

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
  layoutProfiles?: Readonly<Record<string, LayoutProfile>>;
};

function isValidProfileSlot(slot: LayoutProfile['slots'][number]): boolean {
  return [slot.x, slot.y, slot.width, slot.height].every(Number.isFinite)
    && slot.x >= 0 && slot.y >= 0 && slot.width >= 0 && slot.height >= 0
    && slot.x + slot.width <= 1 && slot.y + slot.height <= 1;
}

function getTemplate(operator: string, childCount: number, profiles: ComposeOptions['layoutProfiles']): LayoutTemplateChild[] | undefined {
  const profile = profiles?.[operator];
  if (profile !== undefined && profile.slots.length === childCount && profile.slots.every(isValidProfileSlot)) {
    return profile.slots.map(({ x, y, width, height }) => ({ x, y, width, height }));
  }
  return LAYOUT_TEMPLATES[operator];
}

function composeNode(ast: IdsNode, box: Box, role: StructuralRole | undefined, options: ComposeOptions): LayoutNode {
  if (ast.type === 'char') {
    const value = role === undefined ? ast.value : resolveVariant(ast.value, role, options.variantMap ?? VARIANT_MAP);
    return { type: 'glyph', value, ...(role === undefined ? {} : { role }), box };
  }

  const template = getTemplate(ast.operator, ast.children.length, options.layoutProfiles);
  if (template === undefined) {
    throw new Error(`Unsupported IDS operator: ${ast.operator}`);
  }
  if (template.length !== ast.children.length) {
    throw new Error(`IDS operator ${ast.operator} requires ${template.length} children`);
  }
  const roles = getChildRoles(ast.operator);

  return {
    type: 'composition',
    operator: ast.operator,
    box,
    children: ast.children.map((child, index) => {
      const slot = template[index];
      if (slot === undefined) {
        throw new Error(`Missing layout slot for IDS operator: ${ast.operator}`);
      }
      const role = roles[index];
      if (role === undefined) {
        throw new Error(`Missing structural role for IDS operator: ${ast.operator}`);
      }
      return composeNode(child, placeBox(box, slot), role, options);
    }),
  };
}

export function composeLayout(ast: IdsNode, options: ComposeOptions = {}): LayoutNode {
  return composeNode(ast, ROOT_BOX, undefined, options);
}
