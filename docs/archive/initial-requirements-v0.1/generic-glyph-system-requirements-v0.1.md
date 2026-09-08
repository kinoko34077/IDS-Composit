# Generic Glyph System／IDS文字合成機構 要件定義書 v0.1

## 0. 文書の目的

本書は、通常のUnicode・フォント体系だけでは直接扱えない文字・字形を、Web等で参照・共有・表示できる汎用機構と、その第一段階として実装するIDS型漢字合成プロトタイプについて定義する。

本構想は単なる「IDSからSVGを生成するライブラリ」ではない。

最終的には、

> **Unicodeに存在する文字は既存の文字・フォント体系をそのまま利用し、Unicode外または明示的に指定された独自字形のみを追加のGlyph Layerで補完する**

ことを目的とする。

その上で、

* 文字・字形の識別
* Registry
* Unicode等との対応解決
* IDS等による構成
* 描画
* Web本文への埋込み

を互いに分離し、特定の描画形式や文字生成方式へ依存しない構造とする。

---

# 1. 原案・問題設定

## 1.1 原案

発想の起点は、DTP・フォントにおけるCharacter ID／Glyph ID／CID的な考え方を、Unicodeに存在しない文字にも一般化できないか、というものである。

現在の文字表示は概ね、

```text
文字コード
↓
Font
↓
Glyph
↓
描画
```

として成立している。

一方、

* Unicode未収録漢字
* 稀少な異体字
* 創作漢字
* 古文書等に存在する特殊字形
* 個人・研究用途の独自文字
* Unicodeへの正式収録前の文字

などは、この体系の外側へ落ちる。

これらを各アプリケーションが、

* 外字フォント
* PUA
* 画像
* SVG
* 個別CSS
* 独自コード

としてばらばらに処理するのではなく、より汎用的なGlyph Layerで扱えるようにする。

---

# 2. 上位目的

本システムの最上位目的は以下である。

> **Unicode・Font・SVG・画像等の個別形式そのものを文字の唯一の正本とせず、「独自Glyphを識別・解決・表示するための中間層」を設ける。**

概念：

```text
Text / Document
      ↓
Glyph Resolution Layer
      ↓
┌─────────────┬──────────────┐
│ Native Unicode           │ External Glyph           │
│ + ordinary fonts         │ ecosystem                │
└─────────────┴──────────────┘
                              ↓
                     Registry / Composition
                              ↓
                     Renderer / Adapter
```

---

# 3. 本システムがUnicodeに対して取る立場

## 3.1 Unicodeを置き換えない

本システムはUnicodeの代替文字コードを作ることを目的としない。

Unicodeに正規の文字が存在する場合、原則としてUnicodeを優先して利用する。

```text
Unicodeで表現可能
→ native Unicode

Unicodeで表現不能
→ Generic Glyph Layer
```

したがって本システムは、

> **Unicodeの外側・前段階・周辺領域を補完する機構**

として位置付ける。

---

## 3.2 既存font fallbackを破壊しない

通常Unicode文字については、ブラウザ・OSが既に持つfont fallbackを優先する。

概念：

```text
Unicode character
↓
Font A
↓
Font B
↓
Font C / system fallback
```

Generic Glyph Layerは、この既存文字体系を不要に置換しない。

将来的には、

```text
native glyph resolution
↓ failure / explicit external glyph reference
Generic Glyph Layer
```

という関係を目指す。

---

# 4. 文字コードと入出力encodingの分離

Unicode等の文字識別体系と、Shift_JIS等の文字列encodingを混同しない。

内部処理・識別は原則としてUnicodeベースとする。

```text
Shift_JIS
UTF-8
UTF-16
etc.
```

は入出力・保存・転送時のencodingであり、Generic Glyph System自身の文字識別モデルとは分離する。

したがって、

> Shift_JIS対応をGlyph Resolverの優先順位へ直接入れない。

---

# 5. 全体アーキテクチャ

本システムは以下の責務へ分離する。

```text
                     Document
                        ↓
                  Source Syntax
                        ↓
                      Parser
                        ↓
                     Resolver
                ┌───────┼────────┐
                ↓       ↓        ↓
             Unicode  Registry  Composition
                ↓       ↓        ↓
                └───────┼────────┘
                        ↓
                   Glyph / Layout
                        ↓
                     Renderer
                        ↓
                     Adapter
                        ↓
                 DOM / SVG / etc.
```

主要責務：

1. Source Syntax
2. Parser
3. Resolver
4. Glyph Registry
5. Composition Engine
6. Layout Model
7. Renderer
8. Display Adapter

これらを一体化しない。

---

# 6. 責務分離原則

## REQ-ARCH-001　RegistryとCompositionを分離する

Registryは「登録済み文字・字形を管理する機構」である。

Composition Engineは「部品から字形・配置を導出する機構」である。

RegistryはIDSを知らなくても成立しなければならない。

Composition EngineもRegistry無しで成立しなければならない。

---

## REQ-ARCH-002　RegistryとRendererを分離する

Registryは字形を「どう描画するか」を強制しない。

Rendererは「登録情報をどう管理するか」を担当しない。

例：

```text
Registry
↓
Glyph representation

Renderer A → DOM
Renderer B → SVG
Renderer C → Canvas
Renderer D → font glyph
```

---

## REQ-ARCH-003　CompositionとRendererを分離する

Composition Engineは、

> 何を、どこへ、どの大きさで配置するか

までを担当する。

SVG path生成やDOM生成そのものはComposition Engineの責務としない。

---

## REQ-ARCH-004　Glyphの生成方法とGlyphの識別を分離する

同じGlyphが、

* IDS
* KAGE
* 手描き
* SVG編集
* 外部DB
* 人間によるトレース

等の異なる方法から生成される可能性を許容する。

したがって、

```text
IDS = glyph ID
```

とはしない。

IDSはGlyphを検索・生成・説明する情報の一つとする。

---

# 7. Generic Glyph Registry構想

## 7.1 Registryの役割

将来的なRegistryは、

> Unicodeに存在するか否かを問わず、独自Glyphを安定した識別子から参照可能にする汎用登録機構

とする。

漢字専用には限定しない。

対象候補：

* 未符号化漢字
* 異体字
* 古文書字形
* 創作文字
* 独自記号
* 特殊記号
* その他Unicode外Glyph

---

## 7.2 RegistryはSVG専用にしない

一時期「SVG Glyph DB」として検討したが、Registry自身をSVG専用に固定しない。

Registryは概念的には、

```text
Glyph Record
├─ stable ID
├─ semantic information
├─ aliases
├─ mappings
├─ representations
└─ metadata
```

を保持する。

`representations`として、

```text
SVG
path
bitmap
stroke data
KAGE data
etc.
```

を持つことは可能だが、Registryの本質とは分離する。

---

## 7.3 Glyph ID

Registry上のGlyphは、Unicode code pointとは独立した識別子で参照可能とする。

具体的なID形式は本版では未確定とする。

候補：

```text
glyph:<ID>
registry:<ID>
content hash
UUID
namespace + ID
```

など。

---

# 8. Unicodeとの対応

Registry Glyphは後からUnicodeとの対応情報を追加可能とする。

概念：

```text
Glyph X
├─ Unicode: none
```

↓

将来Unicode収録

```text
Glyph X
├─ Unicode: U+XXXXX
```

この場合、一般表示ではUnicodeへ移行可能とする。

一方で、歴史的字形・特定字形を固定する用途ではRegistry Glyphを維持できる構造とする。

---

# 9. 保存表現と表示表現を分離する

本システムの重要原則として、

> **文書へ何を書いて保存するか**

と、

> **現在どの方式で描画するか**

を分離する。

例：

```text
保存：
⟦⿰水青⟧
```

現在：

```text
DOM/CSS合成
```

将来：

```text
登録済SVG
```

さらに将来：

```text
Unicode文字
```

となっても、文書を全面的に書き直さず解決方法だけ変更できることを目指す。

---

# 10. Source Syntax

## 10.1 初期記法

通常文字列中へ、

```text
⟦...⟧
```

を用いて特殊Glyph表現を埋め込む。

初期プロトタイプでは内部にIDSを記述する。

例：

```text
これは⟦⿰木可⟧という字です。
```

`⟦` `⟧`はアプリケーション側の埋込delimiterであり、IDSそのものの一部ではない。

---

## 10.2 将来的なnamespace

将来的には必要に応じて、

```text
⟦ids:...⟧
⟦glyph:...⟧
⟦char:...⟧
```

等のnamespace導入を可能とする。

ただし具体的な構文は本版では確定しない。

現在のプロトタイプでは、

```text
⟦IDS⟧
```

のみでよい。

---

# 11. Resolver構想

Resolverは入力された表現から、利用すべき文字・Glyphを決定する。

将来の基本方針：

```text
Input
↓
既存Unicodeへ解決可能？
├─ YES → Unicode
└─ NO
    ↓
Registryに登録済Glyphあり？
├─ YES → Registry Glyph
└─ NO
    ↓
Composition可能？
├─ YES → temporary composition
└─ NO
    ↓
fallback / source representation
```

この優先順位により、

> Unicodeで普通に扱える字をわざわざ独自Glyph化しない。

---

# 12. IDSの位置付け

IDSは本システムそのものではない。

IDSは、

> 漢字等の構造を記述し、Composition Engineへ入力する方法

の一つである。

したがって、

```text
Generic Glyph System
    ↑
    │
Han Composition Engine
    ↑
    │
IDS
```

という関係とする。

RegistryがIDSの下位に存在する構造にはしない。

---

# 13. Han Composition Engine

Han Composition Engineは、既存文字・部品を組み合わせて疑似的な一文字を構成する。

入力：

```text
IDS AST
```

出力：

```text
Layout Model
```

を基本とする。

この段階ではSVG・DOM等へ描画しない。

---

# 14. IDS Parser

## REQ-PARSE-001

IDS型記述をASTへ変換する。

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

## REQ-PARSE-002

入れ子構造を保持する。

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

Parserは描画処理を行わない。

---

# 15. Structural Role

Composition Engineは各IDCから、その子要素の構造的位置を導出する。

初期role：

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
水 = left
青 = right
```

このroleは、位置別部品variantの解決にも利用する。

---

# 16. 位置別部品Variant

## 16.1 基本思想

漢字には同じ意味上の部品でも、配置位置に応じて異なるUnicode文字形が既に存在する場合がある。

例：

```text
水 → 氵
火 → 灬
心 → 忄
手 → 扌
人 → 亻
犬 → 犭
```

これを自動利用する。

---

## REQ-VAR-001

位置別変換は、

```text
(base character, structural role)
→ variant
```

として定義する。

例：

```text
水 + left   → 氵
水 + bottom → 氺

火 + bottom → 灬

心 + left   → 忄

手 + left   → 扌
```

---

## REQ-VAR-002

入力では可能な限り意味上の基底文字を使用する。

推奨：

```text
⿰水青
```

表示時：

```text
水[left]
↓
氵
```

とする。

原文を最初から、

```text
⿰氵青
```

へ固定することを必須とはしない。

---

## REQ-VAR-003

Variant Mapはデータとして管理する。

概念：

```json
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

大量の`if`文へ埋め込まない。

---

## REQ-VAR-004

Variantが存在しない場合は基底文字をそのまま利用する。

```text
専用variantあり
→ variant使用

専用variantなし
→ 元文字を縮小・配置
```

未知部品によってComposition全体を停止しない。

---

# 17. Layout Model

Composition Engineは描画方式非依存のLayout Modelを生成する。

最低限必要な情報：

```text
content
role
x
y
width
height
children
```

概念：

```json
{
  "operator": "⿰",
  "children": [
    {
      "content": "氵",
      "role": "left",
      "x": 0,
      "y": 0,
      "width": 0.5,
      "height": 1
    },
    {
      "content": "青",
      "role": "right",
      "x": 0.5,
      "y": 0,
      "width": 0.5,
      "height": 1
    }
  ]
}
```

ネストしたcompositionは子Layout Modelとして保持する。

---

# 18. Layout Template

## 18.1 初期方針

プロトタイプでは、

> **構図ごとの配置比率を一律とする。**

部品・画数・組合せによる個別補正は行わない。

---

## REQ-LAYOUT-001

各IDCは固定Layout Templateを持つ。

概念：

```text
⿰
→ 左右

⿱
→ 上下

⿴
→ 外側 + 内側
```

---

## REQ-LAYOUT-002

配置比率はデータとして定義する。

例：

```json
{
  "⿰": [
    {
      "role": "left",
      "x": 0,
      "y": 0,
      "width": 0.5,
      "height": 1
    },
    {
      "role": "right",
      "x": 0.5,
      "y": 0,
      "width": 0.5,
      "height": 1
    }
  ]
}
```

具体的な50:50等の値は容易に後から変更可能とする。

---

## REQ-LAYOUT-003

初期版では以下を考慮しない。

* 字ごとの最適幅
* 画数
* 重心
* stroke密度
* 組合せ固有補正
* 光学補正
* 筆画接続

まず一律Layoutで限界を検証する。

---

# 19. 初期プロトタイプ

## 19.1 プロトタイプの目的

最初からSVG生成器を作らない。

最初に検証する仮説は、

> **既存Unicode文字をCSSで縮小・移動・重ね合わせるだけで、未符号化漢字等をどの程度判読可能に表示できるか**

である。

---

## 19.2 初期描画方式

使用：

```text
HTML
DOM
CSS
position
scale
translate
overflow
重ね合わせ
```

使用しない：

```text
SVG
Canvas
KAGE
path生成
font生成
Registry
server-side rendering
```

---

# 20. DOM Inline Display Adapter

Layout ModelをWeb本文へ投影する。

概念：

```html
<span class="composed-character">
  <span class="part left">氵</span>
  <span class="part right">青</span>
</span>
```

親要素は概ね一文字相当の領域を持つ。

```css
.composed-character {
  display: inline-block;
  position: relative;
  width: 1em;
  height: 1em;
}
```

各部品はabsolute positioning等により配置する。

---

# 21. ネスト表示

IDS ASTの再帰構造は、そのままLayout ModelおよびDOMへ再帰的に反映可能とする。

入力：

```text
⿰木⿱日月
```

概念DOM：

```html
<span class="composition lr">
  <span class="part">木</span>

  <span class="composition tb">
    <span class="part">日</span>
    <span class="part">月</span>
  </span>
</span>
```

---

# 22. v0.1標準処理フロー

```text
通常本文
↓
Text Scanner
↓
⟦...⟧ 検出
↓
IDS Parser
↓
AST
↓
Structural Role Resolver
↓
Variant Resolver
↓
Layout Template
↓
Composition Engine
↓
Layout Model
↓
DOM Inline Adapter
↓
HTML/CSSによる即席合成表示
```

例：

```text
⟦⿰水青⟧
```

↓

```text
⿰
├─ 水
└─ 青
```

↓

```text
水.role = left
青.role = right
```

↓

```text
水[left] → 氵
```

↓

```text
固定⿰ Layout
```

↓

```text
┌─────────┐
│ 氵 │ 青 │
└─────────┘
```

---

# 23. モジュール一覧

## 23.1 v0.1実装対象

| モジュール                 | 責務                         |
| --------------------- | -------------------------- |
| Text Scanner          | 本文中から特殊記法を検出               |
| IDS Parser            | IDSをASTへ変換                 |
| Role Resolver         | IDCから部品位置を決定               |
| Variant Resolver      | 基底文字と位置から部品variantを選択      |
| Layout Template Store | IDCごとの固定配置を保持              |
| Composition Engine    | ASTからLayout Modelを構築       |
| DOM Inline Adapter    | Layout ModelをHTML/CSS表示へ変換 |

---

## 23.2 将来追加

| モジュール                       | 責務                              |
| --------------------------- | ------------------------------- |
| Glyph Resolver              | Unicode・Registry・Compositionの選択 |
| Unicode Resolver            | 既存Unicodeとの対応                   |
| Glyph Registry              | 独自Glyph登録・参照                    |
| SVG Renderer                | SVG描画                           |
| Canvas Renderer             | Canvas描画                        |
| Font Renderer/Exporter      | font glyph化                     |
| Advanced Composition Engine | 高品質な漢字部品変形                      |
| KAGE Adapter                | KAGE等との接続                       |

---

# 24. 将来の解決フロー

最終的には概ね以下の構造を目指す。

```text
Source representation
↓
Resolver

Unicode相当あり？
├─ YES
│   ↓
│ native Unicode
│   ↓
│ normal font fallback
│
└─ NO
    ↓
Registry Glyphあり？
├─ YES
│   ↓
│ registered glyph
│
└─ NO
    ↓
Composition可能？
├─ YES
│   ↓
│ temporary composed glyph
│
└─ NO
    ↓
source fallback / missing representation
```

---

# 25. Rendererの将来拡張

同一Layout Modelから複数描画方式を利用可能とする。

```text
Layout Model
├─ DOM/CSS Adapter
├─ SVG Renderer
├─ Canvas Renderer
├─ Bitmap Renderer
└─ Font Glyph Exporter
```

SVGは本システムの中心ではなく、複数Rendererの一つとして位置付ける。

---

# 26. RegistryとCompositionの将来統合

Registryが実装された場合でも、Composition Engineそのものは変更しない。

概念：

```text
Glyph request
↓
Registry lookup
├─ registered
│    ↓
│ completed glyph
│
└─ not registered
     ↓
Composition Engine
     ↓
temporary layout
```

Composition結果をRegistryへ登録するかどうかも別責務とする。

---

# 27. Registryの社会的・共有的構想

将来的には、

> 誰でもUnicodeに存在しないGlyphを登録・共有・参照できる仕組み

への発展を可能とする。

ただし、

```text
誰でも登録可能
```

と、

```text
正本・canonical glyph
```

を同義とはしない。

将来的には、

* user glyph
* verified glyph
* canonical glyph
* variant
* duplicate
* deprecated

等の状態を持つ余地を残す。

具体的なGovernanceは本版対象外。

---

# 28. Glyphの意味と見た目を分離する

同じ意味上の文字に複数Glyphが存在し得る。

また、同じGlyph表現に複数の由来情報が存在し得る。

したがって、

```text
Character identity
Glyph identity
Glyph representation
Composition recipe
```

を将来的に区別可能なモデルとする。

本プロトタイプでは完全実装しないが、データモデル上それらを同一概念として固定しない。

---

# 29. v0.1の非対象

以下をv0.1の完成条件に含めない。

### Registry系

* DB
* API
* user account
* glyph ID
* canonicalization
* SVG登録
* moderation

### 高品質字形生成

* KAGE
* 筆画データ
* stroke変形
* glyph path
* 手書き補正
* 書体への完全追従

### 高度なRenderer

* SVG
* Canvas
* WebGL
* PDF
* OpenType生成

### Browser内部統合

* native font fallback callback
* shaping engine統合
* glyph cluster統合
* OS font renderer統合

### 高度な文書機能

* 完全な検索統合
* 完全な選択統合
* IME
* native cursor behavior
* PDF完全互換
* EPUB完全互換

---

# 30. v0.1検証目的

本プロトタイプで答えるべき問いは以下である。

### Q1

既存完成文字を単純に縮小・変形して並べるだけで、漢字として判読可能か。

### Q2

`水 → 氵`等の位置別Unicode variantを使うことで、どの程度品質が改善するか。

### Q3

IDCごとの一律Layoutだけで、どの程度の漢字構造をカバーできるか。

### Q4

どの構造・部品から個別補正が必要になるか。

### Q5

DOM/CSSだけで通常本文中の一文字として実用的に表示できるか。

これらを確認した後に、高度なRendererやRegistryへ進む。

---

# 31. v0.1受入条件

## AC-001

以下を本文から検出できる。

```text
⟦⿰木可⟧
```

囲み外本文を破壊しない。

---

## AC-002

二項IDCをASTへ変換できる。

---

## AC-003

ネストIDSを再帰的に解析できる。

---

## AC-004

IDCから、

```text
left
right
top
bottom
outer
inner
```

等のroleを解決できる。

---

## AC-005

位置別Variant Mapを適用できる。

例：

```text
水[left] → 氵
火[bottom] → 灬
心[left] → 忄
```

---

## AC-006

Variant未定義部品でも失敗せず、元文字を使用できる。

---

## AC-007

各IDCへ固定Layout Templateを適用できる。

---

## AC-008

描画方式非依存のLayout Modelを生成できる。

---

## AC-009

Layout ModelをDOM/CSSへ投影できる。

---

## AC-010

複数部品を一文字相当の領域へ配置できる。

---

## AC-011

ネスト構造も一文字相当の領域内へ再帰的に配置できる。

---

## AC-012

SVG、Canvas、Registry、API、KAGE無しで動作する。

---

## AC-013

Composition EngineがDOM・SVG等の固有形式へ直接依存しない。

---

## AC-014

Variant Map・Layout Templateを実装コードの大量条件分岐ではなくデータとして変更できる。

---

# 32. 現時点で確定していない事項

以下は議論済みであるが、具体仕様はまだ確定していない。

* 全IDCへの初期対応範囲
* 3項IDCの初期対応
* `⿰`の具体比率
* `⿱`の具体比率
* 囲み構造のinner margin
* baseline補正
* 使用font
* Variant Map完全一覧
* CJK Radicals Supplementをどこまで利用するか
* 既存Unicode文字への自動reverse lookup
* Unicode→IDS DB
* Registry ID形式
* Registry API形式
* canonical glyph判定
* SVG representation仕様
* copy時の原文復元方式
* accessibility metadata
* dynamic DOM監視
* Shadow DOM使用有無
* package名
* repository構成

これらは確定前提として実装へ固定しない。

---

# 33. 将来ロードマップ上の概念段階

## Phase 0 — DOM Composition Prototype

現在対象。

```text
IDS
↓
位置別variant
↓
固定layout
↓
DOM/CSS
```

---

## Phase 1 — Composition品質向上

候補：

* IDC追加
* Variant Map拡充
* Layout比率調整
* 部品種別補正
* optical correction

---

## Phase 2 — Resolver

```text
IDS
↓
Unicode既存確認
↓
native Unicode / composition
```

---

## Phase 3 — Generic Glyph Registry

```text
stable glyph ID
registration
lookup
metadata
mapping
```

---

## Phase 4 — Renderer追加

```text
DOM
SVG
Canvas
etc.
```

---

## Phase 5 — Advanced Glyph Generation

必要に応じて、

* KAGE
* stroke composition
* glyph editing
* font export

等を追加する。

これらはPhase 0のComposition modelを破棄せず拡張可能とする。

---

# 34. 本システムの不変原則

今後の実装・仕様変更でも、特段の仕様変更がない限り以下を維持する。

### Principle 1

**Unicodeを不要に再発明しない。**

Unicodeで表現可能な文字はnative Unicodeを優先する。

### Principle 2

**Unicode外Glyphを「画像扱いするだけ」で終わらせない。**

安定した識別・解決・共有可能性を持つ中間層へ発展可能とする。

### Principle 3

**Registry・Composition・Rendererを分離する。**

### Principle 4

**IDSをRegistryの正本としない。**

IDSは構造記述・検索・生成方法の一つとする。

### Principle 5

**SVGをシステムの正本形式としない。**

SVGは利用可能なrepresentation／Rendererの一つとする。

### Principle 6

**保存表現と表示表現を分離する。**

### Principle 7

**初期プロトタイプは極力単純にする。**

既存文字をその場で、

* 縮小
* 移動
* 配置
* 重ね合わせ

するだけで検証する。

### Principle 8

**位置別部品variantを自動利用する。**

意味上の基底文字から、

```text
base + role
→ variant
```

として解決する。

### Principle 9

**配置比率は当面IDC単位で一律とする。**

個別字形最適化をv0.1へ持ち込まない。

### Principle 10

**高度化しても初期データモデルを特定Rendererへ従属させない。**

---

# 35. 全体構造の最終要約

```text
────────────────────────────────
          Document Layer
────────────────────────────────

通常Unicode本文
+
⟦特殊Glyph表現⟧


                ↓


────────────────────────────────
          Resolution Layer
────────────────────────────────

Parser
↓
Resolver

├─ Unicode
├─ Generic Glyph Registry
└─ Composition Engine


                ↓


────────────────────────────────
        Glyph / Layout Layer
────────────────────────────────

registered glyph

or

composition layout


                ↓


────────────────────────────────
           Render Layer
────────────────────────────────

DOM/CSS
SVG
Canvas
Font
etc.


                ↓


────────────────────────────────
             Display
────────────────────────────────

通常文字と独自Glyphを
同一本文中で表示
```

現在実装する部分のみ抜き出すと、

```text
⟦⿰水青⟧
↓
IDS Parser
↓
AST
↓
role resolution
↓
水[left] → 氵
↓
⿰固定Layout
↓
Layout Model
↓
DOM/CSS
↓
既存文字を強引に並べて
疑似一文字として表示
```

である。

---

# 36. 本版における最重要定義

本プロジェクトで作ろうとしているものを一文で定義すると、

> **Unicode・Font体系を基礎として維持しながら、その外側に存在する任意Glyphを、独立した識別・解決・構成・描画レイヤーによって通常文字列へ接続できるGeneric Glyph Systemを構築し、その第一実証としてIDSと既存Unicode文字を用いたDOM/CSS漢字合成機構を実装する。**

これを本書v0.1の上位要件とする。
