# IDS型文字部品合成表示機構 要件定義書 v0.1

## 1. 文書の位置付け

本書は、既存Unicode文字を部品として用い、IDSまたはIDSに準じた構造記述に従って、Web上で複数文字を縮小・移動・重ね合わせることにより、Unicodeに存在しない漢字等を疑似的に一文字として表示する機構の要件を定義する。

本書が対象とするのは**初期プロトタイプとしての文字構成・配置機構**である。

以下は本機構とは独立した責務として扱い、本版では実装対象としない。

* Glyph Registry
* SVG Renderer
* Canvas Renderer
* OpenType/font生成
* KAGE等による筆画生成
* 永続的な字形DB
* 完成字形の人手修正・登録機構

本版では、最終字形データを生成・保存するのではなく、**既存文字をその場で強引に配置して、一文字に見える状態を作ること**を目的とする。

---

# 2. 背景と最終構想

## 2.1 背景

通常のフォントは、Unicode等の文字コードとglyphを対応させ、文字列として表示する。

しかし、

* Unicodeに未収録の漢字
* 創作漢字
* 稀少字
* 将来符号化され得る字
* 任意の構造で生成した字

については、通常の文字コードとフォントだけでは直接表示できない場合がある。

本構想では、この問題を一つの巨大なフォント形式へ集約せず、以下の責務へ分離する。

```text
構造記述
   ↓
Parser
   ↓
Composition Engine
   ↓
Layout Model
   ↓
表示方式
```

将来的には、この外側へ独立したRegistry・Resolver・Renderer等を接続可能とする。

---

# 3. 基本設計原則

## REQ-ARCH-001　文字構成と描画方式を分離する

Composition Engineは、

> 「何を、どこへ、どの大きさで配置するか」

のみを決定する。

SVG、Canvas、PNG、OpenType等の特定描画形式をComposition Engine自身の責務へ含めてはならない。

概念構造は以下とする。

```text
IDS / IDS-like expression
        ↓
      Parser
        ↓
Composition Engine
        ↓
   Layout Model
        ↓
   ┌────┼─────┐
   ↓    ↓     ↓
 DOM   SVG   Canvas ...
```

初期プロトタイプではDOM/CSSによる直接表示のみ使用する。

---

## REQ-ARCH-002　RegistryをComposition Engineから分離する

将来的なGlyph RegistryはComposition Engineとは独立させる。

Registryは、

* glyph ID
* 完成字形
* SVG等の字形資産
* Unicodeとの対応
* IDSとの対応
* metadata

等を管理し得るが、文字をどのように構成したかをComposition Engineへ強制してはならない。

Composition EngineもRegistryの存在を前提としてはならない。

したがって初期プロトタイプはRegistry無しで単独動作可能とする。

---

## REQ-ARCH-003　RendererをComposition EngineおよびRegistryから分離する

SVG等へ確定的に描画するRendererは、Composition EngineおよびRegistryとは独立した責務とする。

初期プロトタイプでは専用Rendererを必要としない。

ブラウザ上で、

* HTML要素
* CSS position
* CSS transform
* scale
* 重ね合わせ

等を用いて、その場で表示するだけで成立させる。

---

## REQ-ARCH-004　中間表現を描画方式非依存とする

Composition Engineの出力は、SVG path等を直接含む形式ではなく、最低限、

```text
content
x
y
width
height
```

等の相対配置情報として表現可能でなければならない。

概念例：

```json
{
  "content": "氵",
  "x": 0.0,
  "y": 0.0,
  "width": 0.5,
  "height": 1.0
}
```

これをLayout Modelと呼ぶ。

---

# 4. 入力要件

## REQ-IN-001　通常文字列中へ構造記述を埋め込めること

通常の文字列へ、特殊な囲み記法によって合成対象を埋め込めること。

基本形：

```text
⟦IDS式⟧
```

例：

```text
これは⟦⿰木可⟧という字です。
```

囲み外の通常文字列はそのまま保持する。

---

## REQ-IN-002　IDS型の前置構造記述を扱うこと

構造記述では、IDCと文字部品を用いたIDS型の記法を基本とする。

例：

```text
⿰木可
⿱艹明
```

構造演算子は子要素を持ち、入れ子構造を許容する。

例：

```text
⿰木⿱日月
```

内部的には木構造として解釈する。

---

## REQ-IN-003　入力部品には既存Unicode文字を利用する

初期プロトタイプでは、構成部品そのものは既存Unicode文字を基本とする。

例：

```text
木
可
水
青
火
心
```

新しい筆画データや独自glyphを部品入力の必須条件とはしない。

---

# 5. Parser要件

## REQ-PARSE-001　構造記述をASTへ変換する

入力されたIDS型記述を構文解析し、AST（Abstract Syntax Tree）へ変換する。

例：

```text
⿰木可
```

↓

```text
      ⿰
     /  \
    木    可
```

---

## REQ-PARSE-002　ネストを保持する

例：

```text
⿰木⿱日月
```

は、

```text
        ⿰
       /  \
      木    ⿱
           / \
          日 月
```

として保持する。

入れ子構造を平坦化してはならない。

---

# 6. 構造役割要件

## REQ-COMP-001　構図から各子要素の位置役割を決定する

Composition EngineはIDCに基づき、各子要素へ構造上の役割を付与する。

最低限、内部概念として以下を扱える構造とする。

```text
left
right
top
bottom
outer
inner
```

例：

```text
⿰水青
```

↓

```text
水.role = left
青.role = right
```

---

# 7. 位置別部品variant要件

## REQ-VAR-001　元文字と位置役割から部品形を変換できること

漢字部品には、位置によって異なるUnicode字形が存在する場合がある。

そのため、

```text
(baseCharacter, structuralRole)
→ componentCharacter
```

という位置別variant変換機構を持つ。

例：

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

---

## REQ-VAR-002　variant規則はデータとして管理する

variant変換規則を個別の条件分岐へ散在させてはならない。

概念例：

```js
{
  "水": {
    "left": "氵",
    "bottom": "氺"
  },
  "火": {
    "bottom": "灬"
  },
  "心": {
    "left": "忄"
  }
}
```

位置別部品が増えた場合、基本的にデータ追加によって対応可能な構造とする。

---

## REQ-VAR-003　入力正本は可能な限り基底形を用いる

位置別variantそのものを構造記述の正本に固定するのではなく、可能な場合は意味上の基底文字を記述し、配置時にvariantを解決する。

推奨：

```text
⿰水青
```

表示時：

```text
水 + left
→ 氵
```

これにより同じ「水」を異なる位置で別字形へ自動変換可能とする。

---

## REQ-VAR-004　variantが存在しない場合も表示を継続する

対応する位置別Unicode文字が存在しない、またはvariant辞書へ登録されていない場合でも合成処理そのものを失敗させない。

fallbackは原則として、

```text
位置別variant
↓ 無ければ
基底文字そのもの
```

とする。

すなわち、

```text
未知部品 + left
→ 元文字をそのまま縮小配置
```

して表示する。

---

# 8. 配置要件

## REQ-LAYOUT-001　配置規則は構図単位で一律とする

初期プロトタイプでは、個々の漢字・部品・画数等に応じた高度な自動レイアウトを行わない。

同じIDCについては原則として同じ配置比率を使用する。

概念：

```text
⿰ → 常に同じ左右比率
⿱ → 常に同じ上下比率
⿴ → 常に同じ外側・内側比率
```

---

## REQ-LAYOUT-002　配置規則をデータ化する

IDCごとの配置比率は、ロジックへ埋め込まずLayout Templateとして保持する。

概念例：

```js
{
  "⿰": [
    { "role": "left",  "x": 0.0, "y": 0.0, "w": 0.5, "h": 1.0 },
    { "role": "right", "x": 0.5, "y": 0.0, "w": 0.5, "h": 1.0 }
  ]
}
```

比率そのものは後からデータ変更だけで調整可能とする。

---

## REQ-LAYOUT-003　初期版では部品固有の高度な補正を要求しない

初期プロトタイプでは以下を行わなくてよい。

* 画数による比率変更
* 部品組合せごとの専用比率
* 字種ごとの光学補正
* 筆画接続
* 骨格変形
* stroke単位変形
* 部品固有の歪み補正

必要な場合は将来のレイヤーとして追加する。

---

# 9. Web表示要件

## REQ-DISP-001　一文字相当の親領域を生成する

合成対象全体を、通常文字列中で概ね一文字分として扱える表示領域へ格納する。

概念：

```html
<span class="composed-character">
  ...
</span>
```

基本寸法は1em相当とする。

---

## REQ-DISP-002　部品を親領域内へ直接配置する

初期プロトタイプではSVGへ変換せず、既存Unicode文字をDOM要素として親領域内部へ直接配置する。

概念：

```html
<span class="composed-character">
  <span class="part left">氵</span>
  <span class="part right">青</span>
</span>
```

---

## REQ-DISP-003　CSSによる縮小・移動・重ね合わせを許容する

各部品の配置には、

* position
* translate
* scaleX
* scaleY
* width
* height
* 必要に応じた重なり

等を使用してよい。

目的はフォントとして正規のglyphを生成することではなく、

> 「見た目として一文字に見える」

状態を低コストで成立させることである。

---

## REQ-DISP-004　ネスト構造をDOMでも再帰的に表現可能とする

入力：

```text
⿰木⿱日月
```

は概念上、

```html
<span class="lr">
  <span>木</span>

  <span class="tb">
    <span>日</span>
    <span>月</span>
  </span>
</span>
```

のような再帰構造として表示可能とする。

ASTと表示構造の対応を保つ。

---

# 10. 処理フロー

初期プロトタイプの標準処理フローは以下とする。

```text
通常文字列
    ↓
特殊記法 ⟦...⟧ の検出
    ↓
IDS型構文の抽出
    ↓
Parser
    ↓
AST
    ↓
IDCから各部品の structuralRole を決定
    ↓
Position Variant Resolver
    ↓
水[left] → 氵 等
    ↓
Layout Template適用
    ↓
Layout Model生成
    ↓
DOM/CSSへ投影
    ↓
本文中へ一文字相当として表示
```

具体例：

```text
⟦⿰水青⟧
```

↓

```text
operator = ⿰

A = 水
B = 青
```

↓

```text
A.role = left
B.role = right
```

↓

```text
水[left] → 氵
青[right] → 青
```

↓

```text
⿰用の固定Layout Template
```

↓

```text
┌────────┐
│ 氵 │ 青 │
└────────┘
```

---

# 11. モジュール構成

初期設計では最低限、以下の責務を分離する。

| モジュール                  | 責務                                  |
| ---------------------- | ----------------------------------- |
| Text Scanner           | 本文から`⟦...⟧`を検出                      |
| IDS Parser             | IDS型記述をASTへ変換                       |
| Role Resolver          | 構図からleft/top等の役割を決定                 |
| Variant Resolver       | 基底文字＋位置から部品variantを解決               |
| Composition Engine     | 部品とLayout TemplateからLayout Modelを生成 |
| Inline Display Adapter | Layout ModelをHTML/CSS上へ投影           |

以下は別モジュールとして将来的に追加可能とする。

| モジュール            | 責務                     |
| ---------------- | ---------------------- |
| Unicode Resolver | IDS等と既存Unicode文字との対応解決 |
| Glyph Registry   | 登録済み完成glyphの管理         |
| SVG Renderer     | Layout/glyphをSVG化      |
| Canvas Renderer  | Canvas描画               |
| Glyph Generator  | KAGE等による筆画生成           |

---

# 12. データ構造

## 12.1 Variant Map

```text
base character
×
structural role
→
display component
```

概念：

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

---

## 12.2 Layout Template

```text
IDC
→
child layout definitions
```

各childは最低限、

```text
role
x
y
width
height
```

を表現できること。

---

## 12.3 Layout Model

描画方式非依存の中間表現とする。

概念：

```json
{
  "type": "composition",
  "operator": "⿰",
  "children": [
    {
      "content": "氵",
      "role": "left",
      "x": 0.0,
      "y": 0.0,
      "width": 0.5,
      "height": 1.0
    },
    {
      "content": "青",
      "role": "right",
      "x": 0.5,
      "y": 0.0,
      "width": 0.5,
      "height": 1.0
    }
  ]
}
```

ネスト時は`content`の代わりに子Layout Modelを保持可能とする。

---

# 13. 初期プロトタイプの非対象

本版では以下を完成条件へ含めない。

## 13.1 字形生成

* strokeからの漢字生成
* KAGE
* GlyphWiki互換生成
* path生成
* SVG生成
* bitmap生成

## 13.2 Registry

* glyph登録
* glyph ID採番
* サーバDB
* canonical glyph判定
* duplicate管理
* version管理
* contributor管理

## 13.3 高度な組版

* 完全なfont fallback統合
* ブラウザshaping engineへの統合
* OpenType生成
* GSUB/GPOS
* glyph cluster処理

## 13.4 高度な文字設計

* 部品ごとの筆画変形
* 左偏専用骨格生成
* 字ごとの個別レイアウト
* 美的バランスの完全自動化

## 13.5 その他

* SVGを正式な文字媒体とする規格
* Unicodeそのものの代替
* OSレベル文字入力
* IME
* Unicode符号位置の独自割当

これらを初期プロトタイプへ混入させない。

---

# 14. 将来互換上の要求

## REQ-FUT-001　SVGを後付け可能とする

現在のComposition Engineを変更せず、

```text
Layout Model
→ SVG Renderer
```

を追加可能な構造とする。

---

## REQ-FUT-002　Registryを後付け可能とする

将来的に、

```text
構造記述
↓
登録済glyphが存在するか確認
├─ あり → Registry glyphを使用
└─ なし → Composition Engineで暫定合成
```

という解決層を追加できる構造とする。

ただしRegistryの有無をComposition Engineへ直接埋め込まない。

---

## REQ-FUT-003　Unicodeへの解決を独立して追加可能とする

将来的に既存Unicode文字との対応が判明している場合、

```text
構造記述
↓
Unicode Resolver
├─ Unicodeあり → native text
└─ Unicodeなし → Registry / Composition
```

とできる構造を維持する。

Unicode Resolver自身はComposition Engineとは別責務とする。

---

## REQ-FUT-004　表示方式を交換可能とする

同一Layout Modelから将来的に、

```text
HTML/CSS
SVG
Canvas
PNG
font glyph
```

等へ出力可能とする。

このためComposition Engineへ特定表示技術を逆流させない。

---

# 15. プロトタイプの目的

本プロトタイプで検証する中心仮説は以下である。

> 既存Unicode文字および既存の位置別部品文字を、IDS型構造に従って単純に縮小・移動・重ね合わせるだけで、Unicode未収録字を実用上判読可能な疑似漢字としてどの程度表示できるか。

したがって、本版で評価すべきものは「フォントとして完成しているか」ではない。

評価対象は、

1. 構造が正しく解釈されるか
2. 位置別variantが自動適用されるか
3. 同じ構図を一律比率で安定して配置できるか
4. ネストした構造を処理できるか
5. 通常本文中で一文字相当に見えるか
6. variant未定義部品でも処理停止せず表示できるか
7. 単純合成方式がどの程度の漢字で判読可能か

である。

---

# 16. 受入条件

初期プロトタイプは、少なくとも以下を満たした時点で成立したものとする。

### AC-001

通常文字列中から`⟦IDS式⟧`を検出し、囲み外の本文を破壊しない。

### AC-002

単純な二項IDS型構造をASTへ変換できる。

### AC-003

ネストしたIDS型構造を再帰的にAST化できる。

### AC-004

IDCから子部品の構造役割を決定できる。

### AC-005

`baseCharacter × structuralRole`に基づき位置別variantを適用できる。

例：

```text
水[left] → 氵
火[bottom] → 灬
```

### AC-006

variantが登録されていない文字は元文字のまま処理を継続できる。

### AC-007

IDCごとに固定されたLayout Templateを適用できる。

### AC-008

Layout Modelを生成できる。

### AC-009

Layout ModelをHTML/CSS上へ投影し、複数Unicode文字を一文字分の領域へ縮小・配置・重ね合わせて表示できる。

### AC-010

ネストCompositionを再帰的なDOM構造として表示できる。

### AC-011

SVG、Canvas、Registry、KAGE等を導入しなくても上記要件が成立する。

### AC-012

Composition Engine内部にSVG固有処理・Registry依存・特定描画方式依存を持たない。

---

# 17. 現時点で未確定の事項

以下は本会話時点では具体値・範囲が確定していないため、本要件定義の固定仕様には含めない。

* 初期対応するIDCの完全な一覧
* 各IDCの具体的配置比率
* `⿰`を50:50、40:60等のどの値にするか
* 囲み構造の内側余白率
* Variant Mapの初期収録件数
* 使用する標準font-family
* CSSの具体的baseline補正値
* 不正IDSの詳細エラー表示
* 動的DOM追加への自動監視方法
* コピー時の元記法復元
* 検索・アクセシビリティへの統合
* API公開方式
* package名・repository名
* Registryの具体的データ形式
* 将来SVG glyphのID体系

これらは実装開始時または必要性が発生した段階で個別に確定する。

---

# 18. 要件の要約構造

```text
入力
  通常文字列 + ⟦IDS型構造⟧

        ↓

Text Scanner

        ↓

IDS Parser
  IDS → AST

        ↓

Role Resolver
  ⿰ → left / right
  ⿱ → top / bottom
  etc.

        ↓

Variant Resolver
  水 + left → 氵
  火 + bottom → 灬
  未定義 → 元文字

        ↓

Composition Engine
  IDC別固定Layout Template

        ↓

Layout Model
  content + relative position/size

        ↓

Inline Display Adapter

        ↓

HTML/CSS
  既存文字を縮小
  移動
  配置
  重ね合わせ

        ↓

通常本文中で
「疑似的な一文字」として表示
```

本版の核心は、

> **漢字を新たに描画するのではなく、既存文字を構造情報に従ってその場で配置する。**

ことである。

また、

> **Parser・Composition・Registry・Renderer・表示Adapterをそれぞれ独立させ、初期プロトタイプではCompositionとDOM/CSS表示だけを最小限実装する。**

ことを基本設計原則とする。
