import type { StructuralRole } from '../core/types';

export const IDC_ARITY: Record<string, number> = {
  '⿰': 2,
  '⿱': 2,
  '⿲': 3,
  '⿳': 3,
  '⿴': 2,
};

export const IDC_ROLES: Record<string, StructuralRole[]> = {
  '⿰': ['left', 'right'],
  '⿱': ['top', 'bottom'],
  '⿲': ['left', 'middle', 'right'],
  '⿳': ['top', 'middle', 'bottom'],
  '⿴': ['outer', 'inner'],
};
