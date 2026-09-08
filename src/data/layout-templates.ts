export type LayoutTemplateChild = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const LAYOUT_TEMPLATES: Record<string, LayoutTemplateChild[]> = {
  '⿰': [
    { x: 0, y: 0, width: 0.5, height: 1 },
    { x: 0.5, y: 0, width: 0.5, height: 1 },
  ],
  '⿱': [
    { x: 0, y: 0, width: 1, height: 0.5 },
    { x: 0, y: 0.5, width: 1, height: 0.5 },
  ],
  '⿲': [
    { x: 0, y: 0, width: 1 / 3, height: 1 },
    { x: 1 / 3, y: 0, width: 1 / 3, height: 1 },
    { x: 2 / 3, y: 0, width: 1 / 3, height: 1 },
  ],
  '⿳': [
    { x: 0, y: 0, width: 1, height: 1 / 3 },
    { x: 0, y: 1 / 3, width: 1, height: 1 / 3 },
    { x: 0, y: 2 / 3, width: 1, height: 1 / 3 },
  ],
  '⿴': [
    { x: 0, y: 0, width: 1, height: 1 },
    { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
  ],
};
