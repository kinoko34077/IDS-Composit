# Calibration data

CalibrationはResolver用Known Indexと別pipelineです。`known-index-v0.2.json`を教師データへ直接流用せず、BabelStone direct-J/X、CHISE `@apparent`/functional、Yi Bai lv0をsource-specific adapterへ通します。

## 生成物の境界

- 既存の`corpus-v0.2.json`と`corpus-multisource-v0.2.json`はv0.1/v0.2初期のResolver・比較用baselineとして保持します。
- 新しいsource corpusは`npm run calibration:build:source`で`.artifacts/calibration/`へ生成します。CHISEの固定revision、hash、licenseはreportに記録します。
- `.artifacts/calibration/`にはsource corpus、mask、per-character evidenceを置き、Gitへcommitしません。
- Gitへ入れるのはsource adapter/generator、font manifest、small summary report、accepted profileだけです。

## 固定実測条件

trainingはSource Han Sans JP 2.005R、cross-font validationはSource Han Serif JP 2.003Rです。font binaryは`.cache/calibration-fonts/`へ取得し、manifestのSHA-256一致を確認します。canvasは160×160、root emは(16,16,128,128)、baselineはfontkit metricsから算出します。fontkit coverageでtargetと全leafを確認し、missing glyphを教師へ入れません。

再生成・実測:

```text
npm run calibration:verify-fonts
npm run calibration:build:source
npm run calibration:measure:operator -- --operator ⿰ --max-train 1000
```

Loss、optimizer、median profile、operator Gateの定義と2026-09-10の⿰実測結果は[Calibration Gate記録](../../docs/v0.2/14_CALIBRATION_GATES.md)を参照してください。accepted profile以外はv0.1 fixed templateへfallbackし、Canvas/fontkitはruntime/npm packageへ漏らしません。
