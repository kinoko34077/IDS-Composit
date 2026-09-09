# Architecture

## v0.2 responsibility extension

v0.1 Runtime / Render APIを互換基準として、v0.2では以下の薄いOrchestrator構造を追加する。

```text
Runtime API
    ↑
Thin Orchestrator
 ┌───────┼────────┐
 ↓       ↓        ↓
Known   Coverage  Layout Profile
Index
```

Known Character Indexは文字対応だけ、Structural CoverageはIDC構造だけ、Layout Profileはpure dataだけを担当する。Parser→DOM、Coverage→Known/CHISE、Known→Layout/DOM、Runtime→Calibrationの依存は禁止する。詳細は [docs/v0.2/02_RESPONSIBILITIES.md](v0.2/02_RESPONSIBILITIES.md) を参照する。

## 1. 基本構造

```text
Document
↓
Text Scanner
↓
IDS Source
↓
IDS Parser
↓
AST
↓
CHISE Resolver ───────────────┐
├─ resolved → Native Text     │
└─ unresolved                 │
        ↓                     │
Role Resolver                 │
        ↓                     │
Variant Resolver              │
        ↓                     │
Layout Engine                 │
        ↓                     │
Layout Model                  │
        ↓                     │
DOM Inline Adapter            │
        ↓                     │
Rendered DOM ←────────────────┘
```

## 2. 変更理由による責務分離

|責務|変わる理由|
|---|---|
|Scanner|埋込記法・DOM走査方式|
|Parser|IDS構文・IDC arity|
|CHISE Adapter|外部API仕様|
|Resolver|native/composition優先規則|
|Role Resolver|IDCの構造意味|
|Variant Resolver|部品variant知識|
|Layout Engine|構図ごとの配置規則|
|DOM Adapter|Web表示方法・CSS|
|Cache|性能・外部依存耐性|

異なる理由で変わる処理を一モジュールへ統合しない。

## 3. 正規内部モデル

### IDS AST

```ts
type IdsNode =
  | { type: "char"; value: string }
  | {
      type: "composition";
      operator: string;
      children: IdsNode[];
    };
```

### Layout Model

```ts
type LayoutNode =
  | {
      type: "glyph";
      value: string;
      role?: StructuralRole;
      box: Box;
    }
  | {
      type: "composition";
      operator: string;
      box: Box;
      children: LayoutNode[];
    };

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};
```

座標は原則0〜1の相対値。

## 4. Resolver result

```ts
type Resolution =
  | { kind: "native"; text: string; sourceIds: string }
  | { kind: "compose"; ast: IdsNode; sourceIds: string }
  | { kind: "unresolved"; sourceIds: string; reason: string };
```

CHISE responseそのものを下流へ漏らさない。

## 5. 禁止依存

```text
Parser       -X-> DOM
Parser       -X-> CHISE HTTP
Layout       -X-> CHISE HTTP
Variant      -X-> CSS
CHISE Adapter-X-> DOM
DOM Adapter  -X-> CHISE ontology
```

## 6. 状態

原則としてstatelessな変換を優先する。

状態を持つ場合：

- CHISE cache：runtime/local cache
- rendered marker：DOM上の一時状態
- configuration：library instance所有

永続文字DBを持たない。
