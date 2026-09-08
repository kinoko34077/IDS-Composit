import type { StructuralRole } from '../core/types';

export type LayoutTemplateChild = {
  role: StructuralRole;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const LAYOUT_TEMPLATES: Record<string, LayoutTemplateChild[]> = {
  '⿰': [
    { role: 'left', x: 0, y: 0, width: 0.5, height: 1 },
    { role: 'right', x: 0.5, y: 0, width: 0.5, height: 1 },
  ],
  '⿱': [
    { role: 'top', x: 0, y: 0, width: 1, height: 0.5 },
    { role: 'bottom', x: 0, y: 0.5, width: 1, height: 0.5 },
  ],
  '⿴': [
    { role: 'outer', x: 0, y: 0, width: 1, height: 1 },
    { role: 'inner', x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
  ],
};
