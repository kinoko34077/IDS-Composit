# Architecture Summary

## 全体
```text
Document
  ↓
Source Syntax
  ↓
Parser
  ↓
Resolver
  ├─ Unicode
  ├─ Registry
  └─ Composition
       ↓
    Layout Model
  ↓
Renderer / Adapter
  ↓
DOM / SVG / Canvas / Font ...
```

## Phase 0
```text
Text Scanner
→ IDS Parser
→ AST
→ Role Resolver
→ Variant Resolver
→ Layout Template
→ Composition Engine
→ Layout Model
→ DOM Inline Adapter
```

## 分離する責務
- Parser: 構文
- Role Resolver: 構造位置
- Variant Resolver: 位置別部品字
- Layout Template: IDC別固定配置
- Composition Engine: Layout Model構築
- Registry: 登録済Glyph管理
- Resolver: Unicode / Registry / Composition選択
- Renderer: 表示形式への変換
- Adapter: 実行環境との接続

## 最重要依存規則
ParserはDOMを知らない。
ComposerはRegistryを知らない。
RegistryはIDSを必須としない。
RendererはRegistry管理をしない。
Layout ModelはSVG固有情報を持たない。
