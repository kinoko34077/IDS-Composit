# Calibration Gate記録

## 位置付け

この章は、`docs/v0.2/13_CALIBRATION_MEASUREMENT.md`で定めたC0〜C17の実装・実測結果を記録する。CalibrationはResolverのKnown Indexとは別pipelineであり、実font evidenceはruntimeへ直接持ち込まない。

```text
BabelStone direct-J / CHISE @apparent / Yi Bai lv0
        ↓ source adapter
CalibrationSourceRecord
        ↓ ambiguity除外・character単位split・coverage gate
Source Han Sans JPでroot slotを最適化
        ↓ coordinate-wise median
Source Han Sans JP holdout + Source Han Serif JP cross-font gate
        ↓ accepted operatorだけ
data/layout-profiles/v0.2.json → DOM/CSS runtime
```

## 固定条件

|項目|値|
|---|---|
|地域|JPのみ|
|training font|Source Han Sans JP 2.005R Regular static OTF|
|cross-font|Source Han Serif JP 2.003R Regular static OTF|
|font binary|`.cache/calibration-fonts/`のみ。Git管理外|
|canvas|160×160 px|
|root em|x=16, y=16, width=128, height=128|
|font size|128 px|
|baseline|fontkit metricsから算出|
|loss|axis 40%, bounds 25%, centroid 15%, area 10%, alpha 10%|
|optimizer|root slotのみ、±0.04 → ±0.02 → ±0.01、各最大3 pass|
|aggregation|coordinate-wise median。mean/p10/p25/p50/p75/p90もreport|
|sampling|character SHA-256、先頭32bit mod 100、0〜19 holdout|

## Source corpus

`known-index-v0.2.json`をCalibrationの正本入力にはしない。固定revisionのsource artifactをsource-specific adapterへ通す。

2026-09-10の生成結果は次のとおり。

|項目|件数|
|---|---:|
|input records|332,963|
|Calibration eligible|136,943|
|primary before per-operator cap|101,076|
|primary after cap|32,365|
|primary train / holdout|12,349 / 20,016|
|alternate train / holdout|28,683 / 7,184|
|diagnostic|102,544|
|excluded|93,476|
|ambiguous IDS|334|

source hash・license・revisionは生成reportに記録する。corpus本体は`.artifacts/calibration/`へ生成し、巨大なraw corpusはcommitしない。

## Gate規則

- operatorごとにtrain 80件以上、holdout 20件以上が必要。満たさない場合は`insufficient-samples`。
- Sans JPはcandidateのmedianがbaselineより小さく、p75が悪化しないこと。
- Serif JPは同じcandidate profileを使い、median/p75ともbaseline以下であること。
- それ以外は`reject`。絶対損失閾値、多数決、根拠のないconfidence scoreは使わない。
- accepted operatorだけを`data/layout-profiles/v0.2.json`へ出力し、未accepted operatorはv0.1 fixed templateへfallbackする。

## C13/C14 実font結果（⿰）

固定source corpusからstableに選んだtraining上限1,000件を測定し、font coverage gate後109件をoptimizerへ投入した。holdoutは全件走査し、Sans/Serif双方でcoverageを通過した1,619件を比較した。

|font|baseline median|candidate median|baseline p75|candidate p75|
|---|---:|---:|---:|---:|
|Source Han Sans JP|0.14087754|0.11150787|0.15653761|0.12823016|
|Source Han Serif JP|0.15715093|0.13619011|0.17525171|0.15264171|

結果は`accept / passed`。生成されたprofileは次のroot slotである。

```json
{
  "operator": "⿰",
  "sampleCount": 109,
  "slots": [
    { "role": "left", "x": 0, "y": 0, "width": 0.54, "height": 1 },
    { "role": "right", "x": 0.4, "y": 0, "width": 0.59, "height": 1 }
  ]
}
```

coverageはSans/Serifともtraining 1,000件中109件、holdout 13,171件中1,619件がfont-supported/raster-eligibleだった。missing glyphを教師へ含めていない。metrics（Sans unitsPerEm 1000 / ascent 1160 / descent -288、Serif unitsPerEm 1000 / ascent 1151 / descent -286）と算出baseline（164.480 / 163.328）はsummaryへ記録する。

## Runtime / Pages

accepted profileは小さな`data/layout-profiles/v0.2.json`だけをruntimeへ統合した。既知Unicode native hitは従来どおり優先し、structural compositionのprofile missはv0.1 fixed templateへfallbackする。個別characterの最適座標・raster maskはruntimeへ入れていない。

Pagesの`validation.html`には、`⿰木可 → 柯`についてNative / v0.1 Fixed / v0.2 Calibratedの三者表示、Gate status、Sans/Serif median・p75、sample countを追加した。ブラウザ表示のfontは実font測定とは別に、ページのCSS fontとして扱う。

## 再現コマンド

```text
npm run calibration:verify-fonts
npm run calibration:build:source
npm run calibration:measure:operator -- --operator ⿰ --max-train 1000
npm test -- --run
npm run typecheck
npm run typecheck:tools
npm run build
npm run build:pages
npm run pack:check
```

`calibration:build:source`はCHISEの固定revisionを取得する。networkを伴うため通常CIでは実行せず、font実測も明示コマンドに分離する。

## C17 最終回帰

2026-09-10の最終確認結果：

| command / check | result |
|---|---|
| `npm test -- --run` | 57 files / 257 tests passed |
| `npm run typecheck` | passed |
| `npm run typecheck:tools` | passed |
| `npm run calibration:verify-fonts` | Sans/Serifのarchive・OTF hash passed |
| `npm run build` | passed; library JS 22.42 kB / gzip 6.75 kB |
| `npm run build:pages` | passed; Calibration report 3.22 kB、Full Known asset 12,932.05 kB |
| `npm run pack:check` | passed; package 16.7 kB / 45 files |
| `git diff --check` | clean（Gitの改行変換warningのみ） |

pack結果には`fontkit`、`@napi-rs/canvas`、font binary、`.cache/calibration-fonts/`、`.artifacts/calibration/`、bulk Known artifactは含まれない。C17時点でv0.2.0-dev.0はRC候補として、accepted profileは⿰だけ、その他operatorはv0.1 fixed template fallbackとして扱う。
