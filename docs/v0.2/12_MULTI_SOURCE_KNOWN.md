# v0.2 Multi-Source Known Character

## 目的

Known Character Indexは唯一の正しいIDSを決めるDBではない。複数の妥当なIDS表現から、既存Unicode characterへ到達するための出典付き補完層である。

```text
CHISE ─────────────┐
BabelStone ────────┼─ source-specific importer
Yi Bai lv0/lv1/lv2 ─┘          ↓
                       normalized source records
                                  ↓
                         multi-source merge / audit
                                  ↓
                         optional unified Known Index
```

## Sourceの役割

|Source|主用途|runtimeへの扱い|
|---|---|---|
|CHISE IDS|広範囲のfunctional IDS、CHISE APIとの整合|optional bulk、GPL notice必須|
|BabelStone IDS|地域別・alternate IDSの補完|optional bulk、上流IDS.TXTの条件に従う|
|Yi Bai lv0|stroke/glyph差を保持したCalibration候補|resolver unionへ直接投入しない|
|Yi Bai lv1|中間variant統合レベルのKnown候補評価|lv2と同時にverified unionしない|
|Yi Bai lv2|UCV上の統合を反映したKnown resolution候補|初期mergeに採用するverified候補|
|hfhchan/ids等|後続のverification / tie-break|現段階では未実装|

Source固有の形式はsource-specific importerに残す。共通中間形式へは`ids`、`character`、`status`、必要最小限の`variantTag`だけを渡し、source ontologyをruntimeへ持ち込まない。

## Statusと構造

- BabelStoneの通常Unicode IDSは`verified`。
- BabelStoneの`{n}`、`？`などのunencoded/unrepresentable componentは`candidate`。
- BabelStoneの`⿾`、`⿿`、`㇯`などlocal renderer未対応operatorは、IDS構造が有効ならnative lookup用mappingとして保持する。
- Yi Bai lv0/lv1はstroke/variant情報を落とさないため初期artifactでは`candidate`。
- Yi Bai lv2はplainなUnicode IDSだけを初期`verified`候補とし、source markerやspecial syntaxは`candidate`。
- 同一characterの異なるIDSはconflictではなく別mapping。
- 同一IDSから複数characterが出る場合はambiguityとし、多数決しない。

## Artifactとloader

source artifactは`data/known/generated/`へ置く。CHISE、BabelStone、Yi Baiのbulk dataはnpm runtime packageやdefault bundleへ自動importしない。

```ts
const entries = entriesFromKnownRecordsArtifact(unifiedArtifact);
const index = createKnownCharacterIndex(entries);
```

統合artifactはtop-level `sources`とrecordごとの`sourceIndexes`を持つ。hydrate後のruntime entryは表示に必要な最小provenanceへ射影されるが、元artifactを保持すれば全Sourceを追跡できる。

## 代表acceptance

`街`には少なくとも次の二つのmappingを保持する。

```text
CHISE       ⿴行圭   → 街
BabelStone  ⿲彳圭亍 → 街
```

統合indexへ明示的にhydrateした場合、両方が一意verified matchとしてnative `街`を返す。これは構造IDSをsemantic canonicalizationして同一化した結果ではない。

## Calibrationとの境界

Resolver用corpusとCalibration用corpusは分離する。複数Sourceから同じcharacterに複数IDSがある場合、Calibrationは初期方針としてcharacterごとにprimary sampleを一件選び、alternate IDSを別検証群へ保持する。lv0はstroke/glyph差を失わない教師候補として扱い、Known resolution用lv2と同じ重みで混ぜない。

Multi-Source mergeとsampling policyの後段として、Calibration専用source corpusをKnown Indexから分離した。`tools/calibration/measurement-config.ts`でJP固定のfont/em/canvas/baseline、`tools/calibration/rasterize.ts`で同じroot em条件のnative/composition alpha mask、`tools/calibration/measure-operator.ts`でcoverage gate・Loss v1・root slot optimizer・operator別holdout Gateを扱う。2026-09-10時点では⿰がSans/Serif Gateを通過し、`data/layout-profiles/v0.2.json`へ小さなGeneric Profileだけを統合している。runtimeへCanvas/SVGやper-character evidenceを導入しない。
