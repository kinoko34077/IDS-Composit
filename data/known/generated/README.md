# Generated Known Character Data

このディレクトリは、外部資料や再現可能な生成処理から得たKnown Character候補を置くための領域です。手動確認済みの補正は`../manual/`へ分離し、生成物へ直接追記しません。

現時点では生成データは未収録です。外部資料の取り込みは`tools/known/generate-index.ts`でsource metadataを付けた決定的artifactへ変換します。runtimeはこのディレクトリを自動importせず、利用側が出典付きIndex artifactを明示的に読み込んで`createKnownCharacterIndex()`へ渡します。
