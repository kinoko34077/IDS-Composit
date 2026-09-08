# AGENTS.md — Generic Glyph System / IDS文字合成機構

## 0. このファイルの役割
本ファイルは、このリポジトリ／資料群を扱うAI・Codex向けの**最小運用指示**である。

毎回すべての仕様書を読む必要はない。
まず本ファイルを読み、必要に応じて `00_INDEX.md` から現在作業に関係する資料だけを辿ること。

> 詳細索引: **`00_INDEX.md`**

---

# 1. プロジェクト目的

最終目的は、

> Unicode・Font体系を維持しつつ、その外側に存在する任意Glyphを、独立した識別・解決・構成・描画レイヤーによって通常文字列へ接続できる Generic Glyph System を構築すること。

第一実証は、

> IDSと既存Unicode文字を使い、複数文字をDOM/CSS上で縮小・移動・重ね合わせ、Unicode未収録字等を疑似一文字として表示すること。

IDSはGeneric Glyph Systemそのものではなく、**漢字Compositionへの入力方式の一つ**である。

---

# 2. 現在の実装対象

現在は **Phase 0 / Stage 0〜5** を優先する。

```text
⟦IDS⟧
→ Text Scanner
→ IDS Parser
→ AST
→ Role Resolver
→ Variant Resolver
→ Layout Template
→ Composition Engine
→ Layout Model
→ DOM/CSS Inline Display
→ 実字形評価
```

Phase 0の目的は、

> 既存完成文字を固定レイアウトへ強引に配置するだけで、どこまで判読可能な疑似漢字になるか

を検証することである。

---

# 3. Phase 0で作らないもの

Stage 5の評価前に、以下を先回り実装しない。

- Glyph Registry
- SVG Renderer
- Canvas Renderer
- KAGE / GlyphWiki系高度生成
- stroke / path生成
- font生成
- server API
- account / auth
- moderation
- canonical glyph判定
- native shaping統合
- OS font fallback callback
- PDF / EPUB完全対応
- IME
- 完全なselection/search統合

上位構想に存在することは、現在実装すべきことを意味しない。

---

# 4. 不変原則

1. **Unicodeを不要に再発明しない。**
   - Unicodeで表現可能な文字はnative Unicodeを優先する。

2. **Registry / Composition / Rendererを分離する。**

3. **IDSをGlyph identityやRegistryの正本にしない。**
   - IDSは構造記述・検索・生成手段の一つ。

4. **SVGをシステムの正本形式にしない。**
   - SVGは将来Renderer / representationの一つ。

5. **保存表現と表示表現を分離する。**

6. **Composition Engineは描画方式を知らない。**

7. **RegistryはComposition方式を強制しない。**

8. **ParserはDOM・Registry・Layout値を知らない。**

9. **位置別variantは `base + structural role → variant` とする。**

10. **variant未定義時は基底文字へfallbackする。**

11. **配置比率は当面IDC単位で一律とする。**

12. **実測前に高度化しない。**
    - Stage 5の破綻分類を、Stage 6以降の根拠とする。

---

# 5. Unicode・Encodingの扱い

Unicodeは文字識別の基礎として維持する。

```text
Unicodeで表現可能
→ native Unicode + normal font fallback

Unicodeで表現不能
または独自Glyph参照
→ Generic Glyph Layer
```

UTF-8 / UTF-16 / Shift_JIS等は入出力・保存・転送時のencodingであり、Glyph identityとは分離する。

Shift_JIS等をResolver優先順位やGlyph ID体系へ入れない。

---

# 6. Phase 0の入力

初期syntax:

```text
⟦IDS⟧
```

例:

```text
これは⟦⿰水青⟧です。
```

`⟦ ⟧` はアプリケーション側delimiterであり、IDS自体の一部ではない。

将来的な `ids:` / `glyph:` 等のnamespaceは未確定。
Phase 0では導入しなくてよい。

---

# 7. 初期IDC

P0:

- `⿰` 左右
- `⿱` 上下
- `⿴` 全囲み

初期Layout値の例:

```text
⿰: 50 / 50
⿱: 50 / 50
⿴: outer 100%, inner centered 60%
```

これらの数値は不変仕様ではなく、**データとして変更可能な初期値**。

---

# 8. AST・Layoutの原則

## AST
IDSの意味構造とネストを保持する。

```text
⿰木⿱日月
```

↓

```text
        ⿰
       /  \
      木    ⿱
           / \
          日 月
```

## Structural Role
初期role:

```text
left
right
top
bottom
outer
inner
```

## Layout Model
描画方式非依存の相対座標を使う。

最低限:

```text
content
role
x
y
width
height
children
```

座標は原則0〜1。

DOM Node、SVG path等をCore Modelへ入れない。

---

# 9. Position Variant

意味上の基底文字を入力し、表示時に位置別Unicode variantへ解決する。

例:

```text
水 + left   → 氵
水 + bottom → 氺
火 + bottom → 灬
人 + left   → 亻
心 + left   → 忄
手 + left   → 扌
犬 + left   → 犭
示 + left   → 礻
糸 + left   → 糹
爪 + top    → 爫
```

推奨入力:

```text
⿰水青
```

表示時:

```text
水[left] → 氵
```

Variant Mapはデータとして管理し、大量のif分岐へ埋め込まない。

---

# 10. 依存方向

## 許容

```text
parser
  ↓
composition core
  ↓
layout model
  ↓
dom adapter
```

将来:

```text
resolver
  ├→ unicode resolver
  ├→ registry client
  └→ composer

svg renderer
  → glyph/layout model
```

## 禁止

```text
parser → DOM
parser → Registry
composer → Registry
composer → SVG
registry → IDS必須
svg renderer → DOM adapter
```

変更理由の異なる責務を混ぜない。

---

# 11. Stage概要

## Stage 0
仕様固定・型・依存境界。

## Stage 1
`IDS String → AST` の純粋Parser。

## Stage 2
Role Resolver / Layout Template / Composition Engine。
`AST → Layout Model`。

## Stage 3
DOM/CSS Inline Display。
通常本文中で疑似一文字表示。

## Stage 4
Position Variant Resolver。
`base + role → variant`。

## Stage 5
実字形評価。
単純方式の成否・限界を分類。

## Stage 6
Stage 5で必要と判定されたComposition補正だけ追加。

## Stage 7
Unicode Resolver。
`Unicode > Composition`。

## Stage 8
Generic Glyph Resolver。
将来 `Unicode > Registry > Composition > Fallback`。

## Stage 9
Generic Glyph Registry MVP。

## Stage 10
SVG Renderer。

## Stage 11
必要な他Renderer。

## Stage 12
必要になった領域だけAdvanced Glyph Generation。

## Stage 13
Registry Governance / canonical / version等。

## Stage 14
Generic Glyph System統合。

---

# 12. Stage Gate原則

各Stageは、次のGateを満たしてから進む。

|Stage|Gate|
|---:|---|
|0|範囲・型・依存境界確定|
|1|DOM無しでParser成立|
|2|DOM無しでLayout Model成立|
|3|本文中inline表示成立|
|4|データ追加だけでvariant拡張|
|5|方式の成否を実測判断|
|6|必要な補正だけ追加|
|7|Unicode/nativeとComposition統合|
|8|解決順序をResolverへ集約|
|9|Registry停止時もComposition継続|
|10|同一ModelからDOM/SVG生成|
|11|需要のあるRendererのみ|
|12|実測された限界にのみ高度生成|
|13|登録自由度とcanonicalを分離|
|14|責務境界を維持した全体統合|

Gate未達のまま、先のStageを理由なく実装しない。

---

# 13. Stage 5の評価分類

失敗は最低限以下へ分類する。

```text
A. Layout比率
B. Variant不足
C. 完成文字圧縮方式の限界
D. Font差
E. DOM組版
F. IDS構造不足
```

対策を原因と混同しない。

Stage 6以降の要件は、この実測結果から導出する。

---

# 14. 将来の解決順序

最終的なResolver方針:

```text
Input
↓
Unicode相当あり?
├─ YES → native Unicode
└─ NO
    ↓
Registry hit?
├─ YES → Registered Glyph
└─ NO
    ↓
Composition可能?
├─ YES → Composed Layout
└─ NO → Fallback / Unresolved
```

優先順位:

```text
Unicode
>
Registered Glyph
>
Composition
>
Fallback
```

Composition Engine自身にこの解決判断を入れない。

---

# 15. Registryの将来原則

Registryは漢字専用・IDS専用・SVG専用にしない。

概念上:

```text
Glyph Record
├─ stable ID
├─ semantic information
├─ aliases
├─ mappings
├─ representations
└─ metadata
```

対象例:

- 未符号化漢字
- 異体字
- 古文書字形
- 創作文字
- 独自記号
- その他Unicode外Glyph

「誰でも登録可能」と「canonical」を同義にしない。

---

# 16. 作業時の資料読取規則

## 最初に読む
1. `AGENTS.md`
2. `00_INDEX.md`
3. 現在Stageの `stages/stageXX/README.md`

## その後
現在作業に必要な枝葉Markdownだけ読む。

例: Parser実装

```text
AGENTS.md
00_INDEX.md
stages/stage01/README.md
stages/stage01/01_GRAMMAR.md
stages/stage01/02_AST.md
stages/stage01/04_TESTS.md
```

Registry・SVG等の将来資料は、現在作業に不要なら読まない。

---

# 17. 実装時のAI/Codex行動規則

- 未確定事項を勝手に確定しない。
- 上位構想を理由に先回り実装しない。
- 現在Stageの責務外へ変更を広げない。
- 既存の確定仕様を一般的ベストプラクティスで置換しない。
- データで表現可能な規則を大量の条件分岐へ埋め込まない。
- CoreへDOM / SVG / Registry依存を逆流させない。
- エラーを曖昧に補完して「動いたこと」にしない。
- Stage完了時は該当Gateを検証する。
- Gate未達項目を完了扱いしない。
- 将来案と現在仕様を同一レベルで扱わない。

---

# 18. 変更管理

仕様変更時:

1. 現在の明示指示を最優先。
2. 最新確定仕様を確認。
3. 影響する最小限のMarkdownだけ更新。
4. `00_INDEX.md` は参照構造が変わる場合のみ更新。
5. 実験値を上位不変原則へ昇格させない。
6. 過去案を現行仕様へ混在させない。

---

# 19. 詳細資料への入口

詳細は **`00_INDEX.md`** を正規入口とする。

主要資料:

```text
00_INDEX.md
01_PROJECT_SCOPE.md
02_ARCHITECTURE_SUMMARY.md

architecture/
quality/
ops/
stages/stage00/
...
stages/stage14/
```

現在作業に必要な資料だけを読むこと。

---

# 20. 最重要要約

現在作るもの:

```text
⟦IDS⟧
→ parse
→ role
→ variant
→ fixed layout
→ Layout Model
→ DOM/CSS
```

現在作らないもの:

```text
Registry
SVG
KAGE
API
Font
高度Glyph生成
```

最終構想:

```text
Unicode
→ Registry
→ Composition
→ Fallback
```

をResolverが選び、

```text
Glyph / Layout
→ 任意Renderer
```

へ渡す。

**詳細・Stage別作業手順は `00_INDEX.md` から辿ること。**
