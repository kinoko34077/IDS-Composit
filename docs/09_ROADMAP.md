# Development Roadmap

## v0.2

v0.1.0（commit `25e0449`）をtag/Releaseで固定した後、Known Character Index、Resolver chain、Spatial IDC Coverage、Calibration evidence、Generic Layout Profile、Pages比較、holdout validationの順に進める。詳細は [docs/v0.2/11_IMPLEMENTATION_ORDER.md](v0.2/11_IMPLEMENTATION_ORDER.md) を参照する。

## Phase 0 — Foundation

成果：
- repository skeleton
- TypeScript build/test
- Core types
- data table skeleton
- demo page

Gate：
- Parser/Core/DOM/CHISE Adapterの責務境界がコード構成で分かれている。

---

## Phase 1 — IDS Parser

実装：
- delimiter parser
- IDS tokenizer
- arity table
- recursive AST
- parse errors

初期IDC：
- `⿰`
- `⿱`
- `⿴`

Gate：
- DOM/CHISE無しでparser unit testsが通る。

---

## Phase 2 — Composition Core

実装：
- StructuralRole
- role table
- Layout Template
- Layout Model
- recursive layout

Gate：
- AST→Layout Modelがpure functionとして検証可能。

---

## Phase 3 — DOM Inline Renderer

実装：
- Text Scanner
- DOM replacement
- 1em parent box
- child positioning
- demo page

Gate：
- 通常本文内で複数IDSを表示できる。

---

## Phase 4 — Position Variants

実装：
- Variant Map
- Variant Resolver
- seed mappings
- fallback

Gate：
- data追加だけでvariantを増やせる。

---

## Phase 5 — CHISE Adapter / Resolver

実装：
- `ids-match`
- response normalization
- native優先
- timeout/error fallback
- cache
- fixture tests
- live smoke test

Gate：
- CHISE hit → native
- no-match/unavailable → composition
- external failureとinternal failureを区別可能

---

## Phase 6 — Visual Validation

実施：
- 固定sample corpus
- 複数font
- 複雑nested IDS
- failure classification

分類：
1. fixed ratio問題
2. variant不足
3. font依存
4. DOM baseline問題
5. 完成文字圧縮方式の限界
6. parser/structure問題

Gate：
- Phase 0方式を継続する根拠と、追加補正が必要な領域が記録される。

---

## Phase 7 — IDS Coverage Expansion

Phase 6の結果に基づき必要なIDCを追加。

原則：
- arity/role/layout table追加で拡張
- 全IDCを先回りで実装しない
- CHISE/Unicode IDSの現行仕様に合わせる

Gate：
- 必要なテストコーパスを処理可能。

---

## Phase 8 — Library Packaging

実装候補：
- ESM
- browser bundle
- npm package
- CDN sample
- documented initialization API

例：

```ts
renderIds(document.body, {
  chise: true
});
```

API形はこのPhaseで確定する。

Gate：
- 空HTMLへ導入して動作確認できる。
- ConsumerがCHISE/Composition内部詳細を知らなくてよい。

---

## Phase 9 — Hardening

必要性に応じて：

- MutationObserver
- contenteditable policy
- cache persistence
- accessibility metadata
- copy fallback
- vertical writing investigation
- performance profiling

ここでもRegistry/SVG/KAGEは対象外。

---

# 明示的にロードマップから削除したもの

以前検討していた以下は、現行方針ではロードマップ外。

- Generic Glyph Registry
- independent Character ID
- SVG Renderer
- KAGE integration
- glyph submission platform
- Unicode代替層

再導入には明示的な仕様変更が必要。
