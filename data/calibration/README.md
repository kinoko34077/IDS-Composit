# Calibration data

`corpus-v0.2.json`は、`data/known/generated/chise-ids-v0.2.json`のverified recordsから、現在のStructural Coverageで解析でき、target/componentが単一Unicode scalarであるものだけを抽出したcompact train/holdout corpusです。

- input: 101,995 Known records
- eligible: 97,482
- train: 77,985
- holdout: 19,497
- excluded: 4,513（構造解析不可、未対応構造、またはUnicode-only条件外）

source revision・hash・licenseはcorpusの`source` objectと[CHISE-IDS-CORPUS-NOTICE.md](CHISE-IDS-CORPUS-NOTICE.md)で確認します。raster画像、Canvas、SVG、文字別runtime配置はまだ生成していません。

再生成:

```text
npm run calibration:build:corpus
```
