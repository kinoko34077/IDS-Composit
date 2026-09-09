import type { StructuralRole } from '../core/types.ts';
import { VARIANT_MAP, type VariantMap } from '../data/variants.ts';

export function resolveVariant(
  baseCharacter: string,
  role: StructuralRole,
  map: VariantMap = VARIANT_MAP,
): string {
  return map[baseCharacter]?.[role] ?? baseCharacter;
}
