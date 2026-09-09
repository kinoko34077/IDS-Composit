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

次段の測定条件は`tools/calibration/measurement-config.ts`で固定する。初期条件は`serif`、font/em 64px、透明64×64px canvas、alphabetic baseline 52px、alpha threshold 0.01であり、font・em・canvas・baselineをnative/composition間で共有する。値は推測でprofileへ採用するためではなく、同条件の測定を再現するためのconfigである。

`tools/calibration/rasterize.ts`にはtools専用のCanvas rasterizerを置く。`rasterizeNativeGlyph()`は完成字を、`rasterizeComposedIds()`は既存のParser/Layout Modelから各leafをroot-absolute boxへ描画し、どちらもalpha maskを返す。nested compositionも各leafの絶対boxを使う。Canvasはruntime packageへimportせず、実fontの存在・tofu判定・native/composition loss・文字単位optimizationはこの次の測定Gateで実行する。

`tools/calibration/measure-sample.ts`の現行入口はprototype段階であり、実font evidence・geometry loss・profile採用は未完了である。結果はメモリ上の測定結果であり、これだけでprofile採用やruntime個別配置を行わない。

## Boundary

Canvas/SVG、rasterize、optimizer、reportは`tools/calibration/`だけに置く。個別結果は`data/calibration/`のevidenceであり、runtimeの文字別配置正本ではない。C0〜C4では専用source contract、policy、ambiguity、character-hash splitまで固定した。実font結果が未取得の間は、Generic Profileの改善やruntime統合を完了扱いにしない。
