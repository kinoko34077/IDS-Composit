# Known import reports

このディレクトリには、外部Known Sourceの取り込み時に生成した件数・重複・ambiguity・source issueの監査reportを置きます。

`chise-ids-v0.2.json`はCHISE IDSの固定revision、`babelstone-ids-v0.2.json`はBabelStoneのfile-date snapshot、`yibai-lv0/lv1/lv2-v0.2.json`はYi Baiの固定revisionに対するsource-specific reportです。`known-index-v0.2.json`はCHISE・BabelStone・Yi Bai lv2のcross-source merge reportで、required metrics、source combination、ambiguity、alternate IDSの観測値を記録します。各reportの`source`または`source(s)`とartifact本体のmetadataが同じhash・revisionを持つことを確認できます。
