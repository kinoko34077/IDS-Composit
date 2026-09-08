import type { StructuralRole } from '../core/types';

export const IDC_ARITY: Record<string, number> = {
  '⿰': 2,
  '⿱': 2,
  '⿴': 2,
};

export const IDC_ROLES: Record<string, StructuralRole[]> = {
  '⿰': ['left', 'right'],
  '⿱': ['top', 'bottom'],
  '⿴': ['outer', 'inner'],
};
