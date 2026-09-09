# Generated Known Character Data

このディレクトリは、外部資料や再現可能な生成処理から得たKnown Character候補を置くための領域です。手動確認済みの補正は`../manual/`へ分離し、生成物へ直接追記しません。

`chise-ids-v0.2.json`はCHISE IDSの抽象文字ファイル16本から生成したcompact bulk artifactです。`babelstone-ids-v0.2.json`はBabelStoneの`IDS.TXT`、`yibai-lv0/lv1/lv2-v0.2.json`はYi Baiの各レベルから生成します。source metadataはartifactの一箇所に保持し、recordsには`ids`、`character`、`status`、必要なSource固有`variantTag`だけを置いてサイズを抑えています。

```text
npm run known:import:chise
npm run known:import:babelstone
npm run known:import:yibai
npm run known:merge
```

`known:merge`はCHISE・BabelStone・Yi Bai lv2を`known-index-v0.2.json`へまとめます。同一pairはdedupeし、同一characterの別IDSは保持し、同一IDSの複数characterはambiguityとして残します。

これらのartifactはnpm packageやcore runtimeへ自動importされません。明示的にJSONを読み込む場合だけ公開APIの`entriesFromKnownRecordsArtifact()`でruntime entryへ展開し、`createKnownCharacterIndex()`へ渡します。単一Sourceの取得元・revision・hash・licenseはartifact内の`source`、統合artifactでは`source(s)`を確認してください。

各Sourceのライセンスと取り扱いは[CHISE notice](CHISE-IDS-DATA-NOTICE.md)、[BabelStone notice](BABELSTONE-IDS-DATA-NOTICE.md)、[Yi Bai notice](YIBAI-IDS-DATA-NOTICE.md)、[multi-source notice](MULTI-SOURCE-DATA-NOTICE.md)を参照してください。
