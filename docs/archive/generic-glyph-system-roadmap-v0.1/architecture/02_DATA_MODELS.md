# Data Models

## AST
```ts
type AstNode =
  | { type: "character"; value: string }
  | {
      type: "composition";
      operator: string;
      children: AstNode[];
    };
```

## Structural Role
初期:
`left | right | top | bottom | outer | inner`

## Variant Map
```ts
type VariantMap = Record<
  string,
  Partial<Record<StructuralRole, string>>
>;
```

例:
```json
{
  "水": {"left": "氵", "bottom": "氺"},
  "火": {"bottom": "灬"},
  "心": {"left": "忄"}
}
```

## Layout Template
0〜1相対座標。
```ts
type LayoutSlot = {
  role: StructuralRole;
  x: number;
  y: number;
  width: number;
  height: number;
};
```

## Layout Model
```ts
type LayoutNode =
  | {
      type: "glyph";
      source: string;
      display: string;
      role?: StructuralRole;
      x: number; y: number;
      width: number; height: number;
    }
  | {
      type: "composition";
      operator: string;
      x: number; y: number;
      width: number; height: number;
      children: LayoutNode[];
    };
```

## 将来のResolver結果
```ts
type ResolvedGlyph =
  | NativeCharacter
  | RegisteredGlyph
  | ComposedLayout
  | Unresolved;
```

## 原則
表示形式固有のSVG path、DOM Node等をCore Modelへ入れない。
