import type { IdsNode, StructuralRole } from '../core/types';
import { IDC_ROLES } from '../data/idc';
import { VARIANT_MAP, type VariantMap } from '../data/variants';
import { parseIds } from '../parser';
import { resolveVariant } from '../variants';

function normalizeNode(node: IdsNode, role: StructuralRole | undefined, variantMap: VariantMap): string {
  if (node.type === 'char') {
    return role === undefined ? node.value : resolveVariant(node.value, role, variantMap);
  }

  const roles = IDC_ROLES[node.operator];
  return node.operator + node.children.map((child, index) => normalizeNode(child, roles?.[index], variantMap)).join('');
}

/**
 * Normalize only the query sent to CHISE. The caller's source remains intact
 * so display composition and metadata continue to use the canonical input.
 */
export function normalizeIdsForChise(source: string, variantMap: VariantMap = VARIANT_MAP): string {
  const normalized = source.normalize('NFC');
  const parsed = parseIds(normalized);
  return parsed.ok ? normalizeNode(parsed.ast, undefined, variantMap) : normalized;
}
