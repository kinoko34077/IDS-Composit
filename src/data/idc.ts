import type { StructuralRole } from '../core/types';

export type IdcDefinition = {
  operator: string;
  arity: number;
  roles: StructuralRole[];
  layoutProfileKey: string;
};

export const IDC_DEFINITIONS: Record<string, IdcDefinition> = {
  '⿰': { operator: '⿰', arity: 2, roles: ['left', 'right'], layoutProfileKey: '⿰' },
  '⿱': { operator: '⿱', arity: 2, roles: ['top', 'bottom'], layoutProfileKey: '⿱' },
  '⿲': { operator: '⿲', arity: 3, roles: ['left', 'middle', 'right'], layoutProfileKey: '⿲' },
  '⿳': { operator: '⿳', arity: 3, roles: ['top', 'middle', 'bottom'], layoutProfileKey: '⿳' },
  '⿴': { operator: '⿴', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿴' },
  '⿵': { operator: '⿵', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿵' },
  '⿶': { operator: '⿶', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿶' },
  '⿷': { operator: '⿷', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿷' },
  '⿸': { operator: '⿸', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿸' },
  '⿹': { operator: '⿹', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿹' },
  '⿺': { operator: '⿺', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿺' },
  '⿻': { operator: '⿻', arity: 2, roles: ['first', 'second'], layoutProfileKey: '⿻' },
  '⿼': { operator: '⿼', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿼' },
  '⿽': { operator: '⿽', arity: 2, roles: ['outer', 'inner'], layoutProfileKey: '⿽' },
};

export const IDC_ARITY: Record<string, number> = Object.fromEntries(
  Object.entries(IDC_DEFINITIONS).map(([operator, definition]) => [operator, definition.arity]),
);

export const IDC_ROLES: Record<string, StructuralRole[]> = Object.fromEntries(
  Object.entries(IDC_DEFINITIONS).map(([operator, definition]) => [operator, definition.roles]),
);
