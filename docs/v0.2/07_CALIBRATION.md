# Layout Calibration

## Teacher data

Known Indexのverified mapping、supported IDC、target glyph、全component glyphが揃うものだけをtraining対象にする。trainingとholdoutを分離し、人手の大量字一覧を正本にしない。

## Measurement order

```text
IDS ↔ Unicode mapping
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

初期実装では、`src/calibration/`にpure metric、`tools/calibration/corpus.ts`にverified entryのtrain/holdout分割、`tools/calibration/generate-corpus.ts`にcompact Known artifactからのUnicode-only corpus生成、`tools/calibration/optimizer.ts`に正規化slotの決定的coordinate search、`tools/calibration/profile.ts`にIDC/role別のevidence集約を置く。CHISE IDS固定revisionから97,482件のcorpus（train 77,985 / holdout 19,497）を生成済みである。

次段の測定条件は`tools/calibration/measurement-config.ts`で固定する。初期条件は`serif`、font/em 64px、透明64×64px canvas、alphabetic baseline 52px、alpha threshold 0.01であり、font・em・canvas・baselineをnative/composition間で共有する。値は推測でprofileへ採用するためではなく、同条件の測定を再現するためのconfigである。

`tools/calibration/rasterize.ts`にはtools専用のCanvas rasterizerを置く。`rasterizeNativeGlyph()`は完成字を、`rasterizeComposedIds()`は既存のParser/Layout Modelから各leafをroot-absolute boxへ描画し、どちらもalpha maskを返す。nested compositionも各leafの絶対boxを使う。Canvasはruntime packageへimportせず、実fontの存在・tofu判定・native/composition loss・文字単位optimizationはこの次の測定Gateで実行する。

`tools/calibration/measure-sample.ts`の`measureCalibrationSample()`は、同じCanvas条件でnative/composition maskを取得し、現行alpha-mask similarityから暫定lossとtop-level slot evidenceを返す。結果はメモリ上の測定結果であり、これだけでprofile採用やruntime個別配置を行わない。

## Boundary

Canvas/SVG、rasterize、optimizer、reportは`tools/calibration/`だけに置く。個別結果は`data/calibration/`のevidenceであり、runtimeの文字別配置正本ではない。C1〜C3の実行には、同じ固定configでnative/compositionを順にrasterizeし、`src/calibration/metrics.ts`の交換可能なmetricへ渡す。実font結果が未取得の間は、Generic Profileの改善やruntime統合を完了扱いにしない。
