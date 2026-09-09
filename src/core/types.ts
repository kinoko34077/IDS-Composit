export type StructuralRole = 'left' | 'middle' | 'right' | 'top' | 'bottom' | 'outer' | 'inner' | 'first' | 'second';

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type IdsNode =
  | { type: 'char'; value: string }
  | {
      type: 'composition';
      operator: string;
      children: IdsNode[];
    };

export type LayoutNode =
  | {
      type: 'glyph';
      value: string;
      role?: StructuralRole;
      box: Box;
    }
  | {
      type: 'composition';
      operator: string;
      box: Box;
      children: LayoutNode[];
    };

export type ResolutionDiagnostic = {
  kind: 'chise-unavailable';
  message?: string;
};

export type Resolution =
  | { kind: 'native'; text: string; sourceIds: string }
  | { kind: 'compose'; ast: IdsNode; sourceIds: string; diagnostic?: ResolutionDiagnostic }
  | { kind: 'unresolved'; sourceIds: string; reason: string; diagnostic?: ResolutionDiagnostic };
