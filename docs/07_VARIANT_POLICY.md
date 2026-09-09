# Position Variant Policy

## v0.2 relationship

Position variantは引き続き表示時の部品選択であり、Known Character Indexの文字同定やCalibrationの教師データを兼ねない。variant追加はStructural Coverage・Known Index・Layout Profileの責務を越えてはならない。

## 1. 目的

完成文字を単純圧縮するより既存の偏・旁・冠・脚用Unicode形を利用した方が判読性が高い場合、それを自動選択する。

## 2. 正本入力

可能な限り意味上の基底部品を入力する。

推奨：

```text
⿰水青
```

表示時：

```text
水 + left → 氵
```

入力へ最初から`氵`を要求しない。

## 3. Data Model

```ts
type VariantMap = Record<
  string,
  Partial<Record<StructuralRole, string>>
>;
```

例：

```json
{
  "水": {
    "left": "氵",
    "bottom": "氺"
  },
  "火": {
    "bottom": "灬"
  },
  "人": {
    "left": "亻"
  },
  "心": {
    "left": "忄"
  },
  "手": {
    "left": "扌"
  },
  "犬": {
    "left": "犭"
  },
  "示": {
    "left": "礻"
  },
  "糸": {
    "left": "糹"
  },
  "爪": {
    "top": "爫"
  }
}
```

これは初期seedであり完全一覧ではない。

## 4. Fallback

```text
mappingあり → variant
mappingなし → base character
```

variant不足をerrorにしない。

## 5. CHISEとの関係

CHISE側に構造・異体・部品情報が存在しても、Phase 0の表示用Variant Mapは小さく始める。

将来、CHISEデータからvariant候補を導出する場合も、

- CHISEを知識源
- Variant Resolverを表示規則

として責務を分ける。

CHISE全情報をVariant Mapへ複製しない。
