# Codex実装指示書｜IDS-Composit v0.1 → v0.2

## 目的

現行v0.1を破棄・再設計せず、v0.1 Runtimeを基礎としてv0.2へ進める。

v0.2では次の4責務を明確に分離する。

```text
A. v0.1 Runtime / Render API
B. Structural Coverage
C. Known Character Index
D. Layout Calibration / Profiles
```

追加機能を既存Rendererへ直接書き込まない。

---

# 0. 最初に行うこと

現行HEAD `25e0449` をv0.1完成基準として扱う。

最初に：

```text
v0.1.0 tag
```

を作成する。

package versionが既に`0.1.0`なら整合を確認する。

その後、

```text
docs/10_CURRENT_STATE.md
```

を、

```text
v0.1 frozen baseline
v0.2 specification / development
```

へ更新する。

---

# 1. v0.1 Compatibility Gate

v0.2変更開始前に、

```text
tests/compat/
```

を追加する。

最低限固定：

- `renderIds()` API
- `observeIds()` API
- invalid source preservation
- renderer failure preservation
- contenteditable default-off
- CHISE failure fallback
- copy source
- accessibility
- nested composition
- MutationObserver stop
- Pages build

注意：

valid IDSが、

```text
composition → native
```

へ改善されること自体は互換違反としない。

---

# 2. AGENTS.md更新

現行の以下は禁止規則を更新する。

旧：

```text
独自文字DB禁止
SVG禁止
Canvas禁止
```

新：

## 禁止

```text
独自Character ontology
独自Generic Glyph Registry
CHISEの再構築
独自CID
runtime SVG renderer
runtime Canvas renderer
font生成
PUA
```

## 許可

```text
出典付きKnown Character Index
manual mapping override
Calibration用Canvas/SVG
measurement artifact
Generic Layout Profile
```

---

# 3. 責務境界を文書化

`docs/02_ARCHITECTURE.md`へ以下を追加する。

```text
Runtime API
    ↑
Thin Orchestrator
 ┌───────┼────────┐
 ↓       ↓        ↓
Known   Coverage  Layout Profile
Index
```

禁止依存も明記する。

---

# 4. Phase v0.2-A — Known Character Index

最初に文字対応付けを作る。

位置調整より先に実施する。

## 作るもの

例：

```text
src/known/
data/known/generated/
data/known/manual/
tests/known/
```

### Entry

最低限：

```ts
{
  ids,
  character,
  source,
  sourceVersion,
  status
}
```

### 必須

- IDS→Character[]
- Character→IDS[]
- provenance
- verified / candidate
- generated/manual分離
- ambiguity handling
- lookup normalization

### Seed test

必須：

```text
⿲彳圭亍 → 街
```

CHISEがno-matchでもlocal Known Indexでnativeへ到達できることを確認する。

---

# 5. Resolver Chain

既存Resolverを巨大化させずProvider chain化する。

概念順：

```text
Explicit Provider
↓
Known Character Index
↓
CHISE
↓
Composition
```

各Providerは文字解決のみを担当する。

Known IndexからLayout情報を返してはいけない。

---

# 6. Phase v0.2-B — Structural Coverage

Known Indexとは独立に実装する。

対象：

```text
既存
⿰ ⿱ ⿲ ⿳ ⿴

追加
⿵ ⿶ ⿷ ⿸ ⿹ ⿺ ⿻ ⿼ ⿽
```

最初のacceptance case：

```text
⟦⿵門日⟧
```

期待：

```text
source-preserving fallback
```

ではなく、

```text
local composition
```

になること。

IDC定義、arity、roles、geometry/profile keyはdata-drivenとする。

大量switchを追加しない。

---

# 7. Coverage Test

各IDCについて最低限：

```text
parse
arity
role assignment
nested parse
layout model
DOM output
invalid arity fallback
```

を確認する。

---

# 8. Phase v0.2-C — Calibration Corpus

Known IndexとCoverageの双方が成立してから開始する。

対象をKnown Indexから自動抽出する。

Filter：

```text
verified mapping
supported IDC
target glyph available
component glyphs available
```

のみ。

人手でtraining字一覧を大量管理しない。

---

# 9. Measurement Tool

production `src/`へCanvas/SVGを混ぜない。

例：

```text
tools/calibration/
├─ rasterize-native
├─ rasterize-composition
├─ measure
├─ optimize
├─ aggregate
└─ report
```

とする。

初期実装はCanvas優先でよい。

SVGを使う場合もCalibration tool内部のみ。

---

# 10. Native vs Composition比較

同一条件：

```text
font
font-size
canvas size
baseline
device scale
```

を揃える。

例：

```text
target:
街

candidate:
⿲彳圭亍
```

を比較する。

---

# 11. Per-character Optimization

最初に**文字単位でできる限り良いplacementを求める**。

調整パラメータ：

```text
x
y
width
height
```

slot overlapを許可する。

「slotは互いに非重複」という制約を置かない。

初期探索algorithmは単純・再現可能な方法を優先する。

AIによる画像判断を初期必須にしない。

---

# 12. Calibration Artifact

個別最適化結果を、

```text
data/calibration/
```

または生成artifactへ保存する。

ただしこれをproductionの文字別layout DBとして直接利用しない。

役割は、

```text
統計解析の教師データ
```

である。

---

# 13. Generic Profile生成

個別placement群を、

```text
IDC
Structural Role
```

単位で集計する。

まずは最小分類：

```text
⿰
⿱
⿲
⿳
⿴
...
```

のみ。

いきなり、

```text
左偏の種類
画数
部首
字種
font category
```

等で細分化しない。

必要性が測定された場合だけ追加する。

---

# 14. Profile Data

例：

```text
data/layout-profiles/v0.2.json
```

Profileはpure dataにする。

RuntimeがCalibration Engineをimportしてはならない。

---

# 15. Runtime Integration

Unknown IDS：

```text
Known Index miss
↓
CHISE miss
↓
Coverage parse
↓
Generic Layout Profile
↓
DOM/CSS composition
```

Known IDS：

```text
Known Index / CHISE
↓
native Unicode
```

とする。

---

# 16. Profile fallback

Profile lookup失敗時：

```text
v0.1 fixed template
```

へ戻す。

Profileデータ破損・未定義でsourceそのものを失わない。

---

# 17. GitHub Pages拡張

現行スマホ確認ページをv0.2検証surfaceとして維持する。

追加すると有効な表示：

### Resolution情報

```text
source IDS
resolution path
Known Index hit/miss
CHISE hit/miss
native/composition
```

### Coverage

```text
⿵門日
```

等、新IDC一覧。

### Calibration比較ページ

既知字について、

```text
Native
v0.1 fixed composition
v0.2 calibrated composition
```

を並べて表示する。

これによりスマホから目視比較可能にする。

---

# 18. Calibration Validation

Training dataと評価dataを分離する。

最低限：

```text
train
holdout
```

へ分ける。

Generic Profileの評価はholdoutのみで判定する。

v0.1 fixed templateとの比較を記録する。

---

# 19. Optimization Gate

Generic Profile採用条件：

最低限、

```text
median loss < v0.1
p75 loss <= v0.1
```

を満たすこと。

個別既知字で良く見えるだけでは採用しない。

---

# 20. 実装順

```text
0. v0.1 tag / compatibility gate
↓
1. docs / AGENTS / ADR更新
↓
2. Known Character Index
↓
3. Resolver chain
↓
4. Spatial IDC Coverage
↓
5. Calibration corpus generator
↓
6. Native/composition measurement
↓
7. Per-character optimizer
↓
8. Calibration result集積
↓
9. Generic Layout Profile生成
↓
10. Runtime profile integration
↓
11. Pages比較UI
↓
12. Holdout validation
↓
13. performance / bundle regression
↓
14. v0.2.0 RC
```

---

# 21. 実装禁止

今回の作業中に以下へ逸脱しない。

```text
Glyph Registryを再建する
CHISE ontologyを複製する
独自文字コードを作る
SVGを本番rendererにする
Canvasを本番rendererにする
font生成へ進む
画数解析AIを先に導入する
字ごとの手動座標補正を大量登録する
Generic Profile完成前に分類軸を増やす
```

---

# 22. 各Phase Done Definition

「コードを書いた」では完了扱いにしない。

必須：

```text
実装
+
unit test
+
integration test
+
Pages / browser実経路
+
Current State更新
+
Traceability更新
```

Known Index変更ではprovenanceを必須。

Calibration変更ではbaselineとの比較結果を必須。

---

# 23. 正本文書更新

v0.2着手時に最低限更新：

```text
AGENTS.md
docs/01_REQUIREMENTS.md
docs/02_ARCHITECTURE.md
docs/05_COMPOSITION_LAYOUT.md
docs/07_VARIANT_POLICY.md
docs/08_TEST_AND_ACCEPTANCE.md
docs/09_ROADMAP.md
docs/10_CURRENT_STATE.md
docs/11_ADR.md
docs/12_TRACEABILITY.md
```

ただし既存内容を機械的に全文書へ重複させない。

各情報は変更理由に対応する正本へ一度だけ置く。

---

# 24. ADR追加

最低限：

```text
ADR — v0.1をv0.2互換基準APIとして保持
ADR — Known Character IndexをCHISE代替DBではなく補完Indexとして採用
ADR — Calibration toolingではCanvas/SVGを許可
ADR — runtime rendererはDOM/CSSを維持
ADR — 個別既知字最適化→Generic Profile導出方式を採用
```

---

# 最終目標

v0.2の価値は、

```text
「既存文字を見つける」
+
「存在しない文字も組める」
+
「その組み方を実在漢字から学んで自然にする」
```

の3点を、

```text
軽量v0.1 Runtime
```

から独立した責務として積み上げることにある。
