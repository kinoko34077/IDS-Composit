import type { StructuralRole } from '../core/types.ts';
import { IDC_ROLES } from '../data/idc.ts';

export function getChildRoles(operator: string): StructuralRole[] {
  const roles = IDC_ROLES[operator];
  if (roles === undefined) {
    throw new Error(`Unsupported IDS operator: ${operator}`);
  }
  return [...roles];
}
