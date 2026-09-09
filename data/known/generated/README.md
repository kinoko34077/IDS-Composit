# Generated Known Character Data

このディレクトリは、外部資料や再現可能な生成処理から得たKnown Character候補を置くための領域です。手動確認済みの補正は`../manual/`へ分離し、生成物へ直接追記しません。

`chise-ids-v0.2.json`はCHISE IDSの抽象文字ファイル16本から生成したcompact bulk artifactです。source metadataはartifactの一箇所に保持し、recordsには`ids`、`character`、`status`だけを置いてサイズを抑えています。再生成は次で行います。

```text
npm run known:import:chise
```

このartifactはnpm packageやcore runtimeへ自動importされません。明示的に読み込む場合だけ`entriesFromKnownRecordsArtifact()`でruntime entryへ展開し、`createKnownCharacterIndex()`へ渡します。取得元・revision・hash・licenseはartifact内の`source`を確認してください。

CHISE由来データのライセンスと取り扱いは[CHISE-IDS-DATA-NOTICE.md](CHISE-IDS-DATA-NOTICE.md)を参照してください。
