# IDS-Composit v0.2 要件・アーキテクチャ仕様書

## 0. 位置づけ

### v0.1
現行 `main` commit `25e0449` をv0.1完成基準とする。

v0.1は以下を成立させた軽量Web runtimeである。

- `⟦IDS⟧`検出
- IDS Parser
- CHISE native resolution
- local composition fallback
- DOM/CSS inline rendering
- positional variant
- nested composition
- MutationObserver
- cache
- copy / accessibility
- GitHub Pages実機確認面
- 軽量化・責務分離・性能最適化

v0.1の公開API・fallback特性・DOM integrationを、v0.2の基礎APIとして扱う。

### v0.2
v0.1を再構築し直すのではなく、その上で以下3能力を追加する。

1. 部品・IDC対応力
2. 既存文字との対応付け
3. 配置精緻化

結果として、v0.2は合計4責務から構成する。

---

# 1. v0.2の4責務

|責務|役割|変更理由|
|---|---|---|
|A. Runtime / Render API|v0.1由来のWeb描画・fallback・DOM統合|Web runtime都合|
|B. Structural Coverage|IDS構造・IDC・部品配置可能性|Unicode IDS体系の対応範囲|
|C. Known Character Index|IDSと既存Unicode文字の対応|文字知識・対応資料|
|D. Layout Calibration|既知字から部品配置相場を学習|表示品質・字形幾何|

4責務を相互に混在させない。

統合作業だけを行う薄いOrchestratorは許可するが、第5のドメイン責務として肥大化させない。

---

# 2. 全体パイプライン

```text
Text
↓
A. Runtime Scanner
↓
IDS Source
↓
C. Known Character Resolver
├─ known Unicode
│    ↓
│  native character
│
└─ unresolved
     ↓
B. Structural Coverage
     ↓
AST / Structural Roles
     ↓
D. Layout Profile
     ↓
Layout Model
     ↓
A. Runtime Renderer
     ↓
DOM/CSS inline glyph
```

v0.2でも最終出力は原則DOM/CSSとする。

Canvas/SVGは後述するCalibration用であり、通常runtime rendererには導入しない。

---

# 3. A — v0.1 Runtime / Render API

## REQ-201
状態: accepted

v0.2はv0.1の公開Web APIを互換基準として維持する。

対象：

```text
renderIds()
observeIds()
provider injection
contentEditable policy
maxConcurrency
copy behavior
accessibility
source-preserving fallback
```

### 互換の意味

維持必須：

- 関数の基本利用方法
- 外部failureでページを破壊しない
- invalid IDSを失わない
- unsupported IDSを失わない
- copy sourceを保持する
- DOM integration
- Observer挙動

改善を許可：

```text
v0.1:
⿲彳圭亍
→ local composition

v0.2:
⿲彳圭亍
→ Known Index
→ 街
```

つまり「valid IDSがnativeへ改善されること」はbreaking changeとは扱わない。

### 非責務

Runtime APIは以下を所有しない。

- IDS→Unicode DB
- CHISE ontology
- calibration corpus
- font解析
- 文字別配置データ
- IDC固有知識の大量条件分岐

---

# 4. B — Structural Coverage

## 目的

「その文字がUnicodeに存在するか」と無関係に、IDSとして表現可能な構造を描画可能にする。

例：

```text
⿵門日
```

Unicode既存字へresolveできなくても、

```text
outer = 門
inner = 日
```

としてcomposition可能にする。

---

## REQ-210 — Spatial IDC Coverage

v0.2.0では空間配置系IDCを対象とする。

### 現在対応

```text
⿰
⿱
⿲
⿳
⿴
```

### v0.2追加対象

```text
⿵
⿶
⿷
⿸
⿹
⿺
⿻
⿼
⿽
```

これにより空間配置系14種を扱う。

### 後続候補

```text
⿾
⿿
```

reflection / rotationはv0.2.x候補とする。

Subtraction系はv0.2.0対象外。

---

## DATA-211 — IDC Definition

IDCはコード条件分岐ではなくデータとして保持する。

最低項目：

```ts
type IdcDefinition = {
  operator: string;
  arity: number;
  roles: StructuralRole[];
  layoutProfileKey: string;
};
```

---

## BEH-212 — Unknown Character Composition

既存Unicode文字に解決できない場合でも、

1. IDCがsupported
2. 全childをParserで扱える

ならcompositionへ進む。

### 例

```text
⟦⿵門日⟧
```

v0.1：

```text
source-preserving fallback
```

v0.2：

```text
門 + 日 のcomposition
```

---

## 非責務

Structural Coverageは以下を知らない。

- 街というUnicode文字
- CHISE HTTP
- Known Character Index
- Canvas
- SVG raster比較
- DOM

---

# 5. C — Known Character Index

## 目的

IDSと、既に存在するUnicode文字との対応穴をローカルデータとして補完する。

代表例：

```text
⿲彳圭亍 → 街
```

---

## DATA-220 — Known Character Entry

単純な

```json
"⿲彳圭亍": "街"
```

だけを正本形式にはしない。

最低限：

```ts
type KnownCharacterEntry = {
  ids: string;
  character: string;
  source: string;
  sourceVersion?: string;
  status: 'verified' | 'candidate';
};
```

を保持する。

理由：

- 同一文字に複数IDSが存在し得る
- 同一IDSに複数候補が生じ得る
- 出典を追跡する必要がある
- 自動生成と手動補正を区別する必要がある

---

## DATA-221 — Many-to-many

内部モデルは、

```text
IDS → Character[]
Character → IDS[]
```

を許可する。

1:1固定にしない。

---

## DATA-222 — Generated / Manual分離

```text
data/known/
├─ generated/
│   └─ ...
└─ manual/
    └─ overrides...
```

のように分離する。

### generated

外部の信頼可能な文字資料から生成。

### manual

外部資料の穴・確認済み補正のみ。

生成データへ直接人手修正を書き込まない。

---

## DATA-223 — Provenance

各entryは最低でも、

```text
どの資料から来たか
どのversionか
自動生成か手動か
verifiedかcandidateか
```

を追跡可能にする。

---

# 6. Known Character Resolution

## BEH-224

Resolutionは概念的に以下の順とする。

```text
Explicit user provider
↓
Verified local Known Index
↓
CHISE
↓
Composition
↓
source fallback
```

ただしpacking・容量評価によってlocal indexのloading方式は変更可能。

---

## BEH-225 — Ambiguity

同一IDSからverifiedなUnicode候補が複数存在し、一意に決定できない場合は勝手に一文字へ確定しない。

```text
ambiguous
↓
次resolver
または
composition
```

とする。

---

# 7. D — Layout Calibration

## 目的

未知・未符号文字を「単純に半分ずつ並べた字」ではなく、実在漢字で観測される構成比率・重なり・余白に近づける。

重要：

**最初から一般比率を人手で決めない。**

既知文字を教師として個別最適化し、その結果から一般配置を導出する。

---

# 8. Calibrationの教師データ

Known Character Indexを教師データの正本とする。

例：

```text
⿲彳圭亍 ↔ 街
⿱艹明   ↔ 萌
...
```

Calibration対象条件：

1. IDS↔Unicode対応がverified
2. 対象fontに完成字glyphが存在
3. 各component glyphも存在
4. 対応IDCがStructural Coverageで扱える
5. native glyphがtofu等ではない

条件を満たさないものは学習対象から除外する。

---

# 9. Calibration順序

## Step 1 — 対応付け確立

```text
IDS
↕
Unicode character
```

をKnown Indexで確定する。

---

## Step 2 — Native Target生成

同一font・同一em条件で、

```text
街
```

を基準画像として描画する。

---

## Step 3 — Composition Candidate生成

同一fontで、

```text
⿲彳圭亍
```

をcomponentからcompositionする。

---

## Step 4 — 字ごとの個別最適化

各componentについて、

```text
x
y
width
height
```

を調整する。

slot同士の重複を許可する。

例：

```text
v0.1

left   0.00–0.333
middle 0.333–0.666
right  0.666–1.00
```

から、

```text
calibrated example

left   0.00–0.39
middle 0.27–0.73
right  0.64–1.00
```

のような重複配置を許可する。

---

## Step 5 — Per-character Calibration Result

個々の既知字について最良配置を記録する。

例：

```ts
type CharacterCalibration = {
  ids: string;
  character: string;
  font: string;
  slots: Box[];
  loss: number;
};
```

これは**runtime正本ではない**。

Calibration evidenceである。

---

## Step 6 — 集団統計

同一IDCの大量既知字から、

```text
median
percentile
distribution
```

等を求める。

例：

```text
⿰ known characters
   ↓
各文字の個別optimum
   ↓
配置分布
   ↓
⿰ Generic Layout Profile
```

---

## Step 7 — Generic Layout Profile

runtimeで未知字へ使うのは、個別既知字の配置ではなく一般化されたProfileとする。

```ts
type LayoutProfile = {
  operator: string;
  slots: {
    role: StructuralRole;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  sampleCount: number;
  corpusVersion: string;
};
```

---

# 10. なぜこの順なのか

禁止する順序：

```text
人間が「左右は55:45くらい」と推測
↓
その比率を全字へ適用
```

採用する順序：

```text
既存字を大量収集
↓
各字で最適配置
↓
配置結果を統計化
↓
標準profileを導く
↓
未知字へ適用
```

つまり、

**実字 → 個別最適 → 一般則**

とする。

---

# 11. Canvas / SVGの役割

Canvas/SVGを通常rendererには採用しない。

許可範囲：

```text
tools/calibration/
```

等の開発・測定系。

用途：

- native glyph rasterization
- composed glyph rasterization
- ink bounding box計測
- alpha mask比較
- image similarity計算
- 個別layout optimization
- profile生成

runtime：

```text
Layout Profile
↓
DOM/CSS
```

のみ。

---

# 12. Calibration評価

完全なpixel一致を必須としない。

理由：

完成字font glyph内部の部品形状は、単独component glyphを単純縮小した形と完全一致しないため。

比較対象は少なくとも、

- ink bounding box
- occupied area
- centroid
- vertical/horizontal occupancy
- alpha mask similarity

等を組み合わせられる構造とする。

比較metric自体は交換可能にする。

---

# 13. v0.2 Runtime Layout

```text
Known character
↓
native Unicode表示

Unknown / unencoded character
↓
Structural Coverage
↓
Generic Layout Profile
↓
Component placement
↓
DOM/CSS
```

ここが重要。

**既知字の個別calibration結果は、原則runtimeでその既知字を描くためには使わない。**

既知字はnative Unicodeで表示できるためである。

個別calibrationは、

```text
未知文字の配置相場を学ぶ教師
```

として利用する。

---

# 14. Profile fallback

Profileが存在しない場合：

```text
v0.2 Profile
↓ miss
v0.1 fixed Layout Template
↓
composition
```

とする。

Profile障害で文字表示自体を失わない。

---

# 15. Runtime依存方向

禁止：

```text
Runtime Renderer → Calibration Engine
Coverage → Known Character DB
Coverage → CHISE
Known Index → DOM
Known Index → Layout
Calibration → production DOM runtime
Layout Profile → CHISE
```

許可：

```text
Orchestrator → Known Index
Orchestrator → Coverage
Orchestrator → Layout Profile
Orchestrator → Runtime Renderer

Calibration Tool
→ Known Index
→ Coverage
→ measurement renderer
```

---

# 16. v0.2非目標

引き続き対象外：

- 独自文字ontology
- Generic Glyph Registry
- CHISE全体の再実装
- 独自CID体系
- PUA自動割当
- font生成
- IME
- OS shaping改造
- runtime SVG renderer
- runtime Canvas renderer
- 文字ごとの手動座標DBを無制限に増やすこと

---

# 17. 旧禁止事項の変更

v0.1まで：

```text
独自文字DB禁止
SVG禁止
Canvas禁止
```

v0.2では次のように再定義する。

### 禁止

```text
独自Character ontology
独自Glyph Registry
CHISE複製DB
runtime SVG renderer
runtime Canvas renderer
```

### 許可

```text
出典付き IDS↔Unicode Known Character Index
manual override
開発用Canvas/SVG measurement
Calibration corpus
Character Calibration evidence
Generic Layout Profile
```

---

# 18. v0.2完成条件

v0.2.0は最低限以下を満たす。

### Coverage

- 空間配置IDC 14種をparse可能
- 各IDCをlocal composition可能
- `⟦⿵門日⟧`がsource fallbackではなくcompositionされる

### Known Index

- IDS↔Unicodeのverified entryを保持可能
- `⿲彳圭亍 → 街`のようなCHISE穴をlocalで解決可能
- provenanceあり
- generated/manual分離
- ambiguityを誤確定しない

### Calibration

- verified known charactersからtraining corpusを生成可能
- native / composed imageを同条件で比較可能
- 既知字ごとのplacement optimizationが可能
- 結果からIDC単位のGeneric Layout Profileを生成可能

### Runtime

- Generated Profileをunknown compositionへ適用
- slot overlap可能
- Profile無しではv0.1 templateへfallback
- v0.1 public API・error containmentを維持

### Validation

v0.1固定layoutに対し、holdout corpusでGeneric Profileが少なくとも、

```text
median comparison loss改善
p75 comparison loss非悪化
```

を満たすこと。

詳細閾値は初回Calibration corpus取得後に確定する。

---

# 19. Version Policy

```text
v0.1.0
現行runtime完成版
commit: 25e0449
↓
tag固定

v0.2.0
├─ Known Character Index
├─ Spatial IDC Coverage
├─ Calibration Engine
└─ Generic Layout Profiles
```

v0.1は歴史的実装を複製保存せずGit tagを正本とする。

v0.2の正本は現行docsを更新して管理する。
