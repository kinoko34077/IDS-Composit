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

複数Source用の`corpus-multisource-v0.2.json`は、Unified Known artifactを明示入力して生成します。characterごとに決定的に1件を`primary`へ選び、残りのIDS表現を`alternate`へ分離するため、同じ完成字がtrain分布を不自然に重くしません。初期Source優先順位はCHISE、BabelStone、Yi Bai lv0/lv1/lv2です。これは測定前のsampling policyであり、配置精度やconfidenceを意味しません。

```text
npm run calibration:build:multisource
```

CHISE由来の`corpus-v0.2.json`はbaselineとして保持し、複数Source corpusで上書きしません。測定条件の固定は`tools/calibration/measurement-config.ts`、tools限定Canvas rasterizationは`tools/calibration/rasterize.ts`にあります。実fontの存在確認、native/compositionのraster evidence、optimizer・profile採用は別Gateです。
