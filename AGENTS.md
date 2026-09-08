# AGENTS.md

## 0. Project Identity

このリポジトリは **CHISE IDS Inline Renderer** を実装する。

目的は、CHISE を文字情報基盤として利用し、通常 Web 本文中の IDS 表現を、既存 Unicode 文字または既存 Unicode 部品の DOM/CSS 合成によって簡易表示することである。

このプロジェクトは新しい文字情報基盤・Glyph Registry・Unicode 代替規格を作らない。

---

## 1. Source of Truth

参照優先順位：

1. 現在のユーザー指示
2. `docs/01_REQUIREMENTS.md`
3. 関連する個別仕様
4. `docs/02_ARCHITECTURE.md`
5. `docs/03_CHISE_DEPENDENCY.md`
6. `docs/09_ROADMAP.md`
7. `docs/10_CURRENT_STATE.md`
8. 実装コード
9. 一般的な慣習

コードと仕様が衝突した場合、勝手にコードを正本化しない。

---

## 2. Hard Scope

### 作る

- `⟦IDS⟧` の検出
- IDS の最小構文解析
- CHISE への文字照合 Adapter
- CHISE で既存文字へ解決できる場合の native Unicode 表示
- 未解決 IDS の簡易 Composition
- 構図ごとの固定 Layout Template
- `水 + left → 氵` 等の位置別部品 variant
- DOM/CSS による inline 合成表示
- fallback・cache・テスト
- npm/CDN 等へ載せられる小さな Web ライブラリ境界

### 作らない

明示的な仕様変更がない限り、以下を実装しない。

- 独自 Glyph Registry
- 独自文字 DB
- CHISE の複製
- 独自 Character ID / CID 体系
- SVG Renderer
- SVG 字形 DB
- KAGE / GlyphWiki 生成
- Canvas Renderer
- OpenType / WebFont 生成
- PUA 自動割当
- IME
- OS font fallback hook
- ブラウザ shaping engine 改造
- 人手 glyph editor
- 公共 glyph 投稿基盤

「将来使えそう」を理由に先回り実装しない。

---

## 3. CHISE Boundary

CHISE は文字知識・文字同定側の依存先である。

本プロジェクトが保持してよいもの：

- CHISE API Adapter
- API response の一時 cache
- 表示に必要な最小 normalized model
- CHISE unavailable 時の runtime fallback
- テスト fixture

本プロジェクトが独自正本として保持しないもの：

- 巨大 IDS→Unicode 対応表
- CHISE 全文字 DB の再構築
- CHISE の文字 ontology の再実装
- CHISE と競合する canonical glyph registry

CHISE API の実仕様を推測しない。外部 API 変更へ触れる作業では現行仕様を確認する。

---

## 4. Core Pipeline

```text
Text
↓
Scanner
↓
IDS Source
↓
Parser
↓
AST
↓
CHISE Resolver
├─ resolved native character
│   ↓
│ Native Adapter
│
└─ unresolved
    ↓
Role Resolver
    ↓
Variant Resolver
    ↓
Layout Engine
    ↓
Layout Model
    ↓
DOM Adapter
```

依存方向を逆転させない。

- Parser → DOM は禁止
- Layout Engine → CHISE HTTP は禁止
- Variant Resolver → DOM は禁止
- CHISE Adapter → Layout/CSS は禁止

---

## 5. Data-Driven Rules

以下はコードの大量条件分岐ではなくデータとして定義する。

- IDC → arity / structural roles
- IDC → Layout Template
- `(baseCharacter, role) → displayVariant`
- optional rendering constants

例：

```json
{
  "水": {
    "left": "氵",
    "bottom": "氺"
  },
  "火": {
    "bottom": "灬"
  }
}
```

ただしデータ駆動化そのものを目的化しない。

---

## 6. Rendering Principle

Phase 0 の表示は「正しい字形生成」ではなく **判読可能な fallback** である。

既存 Unicode 文字を、

- 縮小
- 移動
- 配置
- 必要時に重ね合わせ

して 1em 相当の inline box 内へ配置する。

字形品質向上のために SVG/KAGE 等を追加してはならない。まず実測で単純合成の限界を確認する。

---

## 7. Error / Fallback Policy

- 不正 IDS：周辺本文を破壊しない
- CHISE unavailable：未解決として local composition を試みる
- CHISE no-match：local composition
- variant 未定義：基底文字をそのまま使う
- 未対応 IDC：元ソースを可視 fallback として保持する
- renderer 失敗：元 `⟦IDS⟧` を失わない

外部依存失敗をページ全体の失敗へ昇格させない。

---

## 8. Test Policy

変更前に受入条件を確認する。

最低限：

- parser unit tests
- role/layout unit tests
- variant tests
- CHISE Adapter tests（fixture + integration を分離）
- scanner integration tests
- browser DOM tests
- visual sample page
- regression tests

外部 CHISE API の live integration failure と内部ロジック failure を区別する。

---

## 9. Work Procedure

大きな作業では以下の順序を守る。

1. `docs/10_CURRENT_STATE.md` を読む
2. 対象 Phase 文書を読む
3. 関連要件 ID を確認
4. 現行コードを確認
5. 小さな差分で実装
6. 対応テスト
7. 回帰テスト
8. 実ブラウザ経路で確認
9. `docs/10_CURRENT_STATE.md` 更新
10. 仕様自体が変わった場合のみ正本文書更新

作業ログを恒久仕様へ混ぜない。

---

## 10. Done Definition

「コードを書いた」「テストを追加した」だけでは完了ではない。

Phase 文書の Gate を満たし、関連テストが通り、実利用経路で確認され、Current State が更新された時点で完了とする。

---

## 11. Documentation Reading Economy

毎回全 docs を読まない。

- 最初：`AGENTS.md` + `docs/00_INDEX.md`
- 実装：対象 Phase doc + 関連仕様
- CHISE変更：`docs/03_CHISE_DEPENDENCY.md`
- Layout変更：`docs/05_COMPOSITION_LAYOUT.md`
- DOM変更：`docs/06_DOM_RENDERING.md`
- 受入判定：`docs/08_TEST_AND_ACCEPTANCE.md`
- 次作業：`docs/10_CURRENT_STATE.md`

---

## 12. Forbidden Drift

以下の兆候が出たら停止して仕様を確認する。

- CHISE の代替 DB を作り始めた
- Registry 設計へ進み始めた
- SVG/KAGE に話が広がった
- 「将来のため」の抽象層が増えた
- Parser が Web API や DOM を知り始めた
- fixed layout の検証前に optical correction を大量追加した
- CHISE API response を独自 ontology として永続化し始めた

このプロジェクトの価値は、**既存文字基盤を再発明せず、未表示 IDS を Web 上で薄く表示可能にすること**にある。
