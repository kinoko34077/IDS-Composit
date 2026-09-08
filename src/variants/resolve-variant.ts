import type { StructuralRole } from '../core/types';
import { VARIANT_MAP, type VariantMap } from '../data/variants';

export function resolveVariant(
  baseCharacter: string,
  role: StructuralRole,
  map: VariantMap = VARIANT_MAP,
): string {
  return map[baseCharacter]?.[role] ?? baseCharacter;
}
