import type { StructuralRole } from '../core/types';

export type VariantMap = Record<string, Partial<Record<StructuralRole, string>>>;

export const VARIANT_MAP: VariantMap = {};
