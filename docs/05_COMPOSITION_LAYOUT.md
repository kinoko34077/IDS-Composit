# Composition & Layout Specification

## v0.2 profile boundary

v0.2では14種のspatial IDCをdata-driven definitionで扱う。Generic Layout Profileは未知字に適用可能なpure dataであり、既知字の個別calibration結果やCHISEをComposition Coreへ持ち込まない。Profile miss時は従来のfixed templateへfallbackする。

## 1. 目的

未解決IDSを、既存Unicode部品の配置として判読可能にする。

「正しいフォント字形生成」は目的ではない。

## 2. Structural Role

初期role：

```text
left
right
top
bottom
outer
inner
```

IDC→roleをdataで定義する。

例：

```text
⿰ → left, right
⿱ → top, bottom
⿴ → outer, inner
```

## 3. Layout Template

初期値は構図単位で一律。

### ⿰

```text
left  : x=0.00 y=0.00 w=0.50 h=1.00
right : x=0.50 y=0.00 w=0.50 h=1.00
```

### ⿱

```text
top    : x=0.00 y=0.00 w=1.00 h=0.50
bottom : x=0.00 y=0.50 w=1.00 h=0.50
```

### ⿴

```text
outer : x=0.00 y=0.00 w=1.00 h=1.00
inner : x=0.20 y=0.20 w=0.60 h=0.60
```

これらは初期検証値であり、data変更で調整可能にする。

## 4. ネスト

親boxの座標系の中で子Layoutを再帰適用する。

絶対pixel値をCoreへ持ち込まない。

## 5. Composition順序

```text
AST
↓
Role assignment
↓
Variant resolution
↓
Layout template
↓
Layout Model
```

## 6. 後回し

Phase 0では実装しない：

- 字ごとの比率
- 画数依存
- 重心補正
- optical correction
- stroke衝突回避
- 偏/旁カテゴリ別比率
- 書体固有補正

まず固定layoutの破綻例を観測してから追加判断する。
