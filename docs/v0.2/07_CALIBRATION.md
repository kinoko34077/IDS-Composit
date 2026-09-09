# Layout Calibration

## Teacher data

`known-index-v0.2.json`はResolver用であり、Calibrationの正本入力にはしない。CalibrationはSource-specific adapterから次の専用recordを受け取る。

- BabelStone: direct JP (`J`) を`primary-candidate`、`X`を`alternate`、`Z`・非JP・special componentを`excluded`
- CHISE: parseable Unicode `@apparent`を`primary-candidate`、functional IDSを`diagnostic`
- Yi Bai lv0: safe primaryを`primary-candidate`、alternativeを`alternate`。lv1/lv2はtrainingへ入れない

`CalibrationSourceRecord.calibrationRole`はKnown Indexの`verified/candidate`とは別の語彙である。NFC IDS key単位のambiguityはtrainingから除外し、diagnosticへ残す。1 characterにつきprimaryは最大1件で、source優先順位とnormalized IDS lexical orderだけを使う。

## Measurement order

```text
IDS ↔ Unicode mapping
↓
Calibration Source Adapter / eligibility / ambiguity
↓
character-hash 80/20 split
↓
同一font・em・baselineでnative target生成
↓
component composition candidate生成
↓
x / y / width / heightを文字単位で最適化
↓
IDC / Structural Roleごとに統計化
↓
未知字用Generic Layout Profile
```

slot overlapを許可する。比較metricは交換可能なpure functionとし、ink bounding box、occupied area、centroid、occupancy、alpha maskを扱える形にする。完全pixel一致は要求しない。

既存の`tools/calibration/corpus.ts`、`generate-corpus.ts`、`generate-multisource-corpus.ts`と生成済みcorpusは履歴・比較用に保持する。新しいCalibration経路は`tools/calibration/sources/`、`select.ts`、`split.ts`、`generate-source-corpus.ts`に置き、Unified Known artifactを直接参照しない。

測定条件は`tools/calibration/measurement-config.ts`で固定する。trainingはSource Han Sans JP 2.005R Regular、cross-font validationはSource Han Serif JP 2.003R Regular、canvasは160×160px、root emは(16,16,128,128)、font sizeは128px、baselineはfontkit metricsから算出する。font・em・canvas・baselineをnative/composition間で共有し、OS font fallbackへ依存しない。

`tools/calibration/rasterize.ts`にはtools専用のCanvas rasterizerを置く。`rasterizeNativeGlyph()`は完成字を、`rasterizeComposedIds()`は既存のParser/Layout Modelから各leafをroot-absolute boxへ描画し、どちらもalpha maskを返す。nested compositionも各leafの絶対boxを使う。実backendはfontkitでcoverageを検査した上で`@napi-rs/canvas`へfontを明示registerし、Canvasはruntime packageへimportしない。

`tools/calibration/measure-calibration-sample.ts`は固定fontの単一sample確認、`tools/calibration/measure-operator.ts`はstable corpusからのoperator測定・root slot最適化・holdout Gateを担当する。Lossはaxis occupancy、ink bounds、centroid、occupied area、raw alphaの5 sub-lossを保持し、個別raster/optimization結果は`.artifacts/calibration/`へ出力してGit/runtimeへ入れない。

## Boundary

Canvas/SVG、rasterize、optimizer、reportは`tools/calibration/`だけに置く。個別結果は`data/calibration/`のcompact summaryまたは`.artifacts/calibration/`のraw evidenceであり、runtimeの文字別配置正本ではない。C0〜C17でsource contract、policy、ambiguity、character-hash split、固定font、coverage、実raster、Loss v1、optimizer、median profile、Sans/Serif holdout Gateまで確定し、現在はGateを通過した⿰だけをGeneric Profileとしてruntimeへ統合している。
