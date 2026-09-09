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

初期実装では、`src/calibration/`にpure metric、`tools/calibration/corpus.ts`にverified entryのtrain/holdout分割、`tools/calibration/generate-corpus.ts`にcompact Known artifactからのUnicode-only corpus生成、`tools/calibration/optimizer.ts`に正規化slotの決定的coordinate search、`tools/calibration/profile.ts`にIDC/role別のevidence集約を置く。CHISE IDS固定revisionから97,482件のcorpus（train 77,985 / holdout 19,497）を生成済みであり、実font raster測定とprofile採用判定は次の別Gateとして行う。

## Boundary

Canvas/SVG、rasterize、optimizer、reportは`tools/calibration/`だけに置く。個別結果は`data/calibration/`のevidenceであり、runtimeの文字別配置正本ではない。
