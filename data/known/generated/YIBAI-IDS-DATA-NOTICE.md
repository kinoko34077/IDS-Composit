# Yi Bai IDS data notice

`yibai-lv0-v0.2.json`、`yibai-lv1-v0.2.json`、`yibai-lv2-v0.2.json`は、Yi Baiの`ids` repositoryから固定revisionで生成したoptional bulk artifactです。

- upstream: <https://github.com/yi-bai/ids>
- license: MIT（上流`LICENSE`）
- fixed revision: artifactの`source.revision`
- source file hash: artifactの`source.fileHash`

lv0はstroke/glyph差を保持するため、lv1/lv2はvariant統合レベルを示すため、各artifactを分離しています。primary IDSとalternative IDSは`variantTag`で区別します。source-specific markerやunencoded componentを安全にUnicode IDSへ落とせないmappingは`candidate`として保持し、lv2のplainな構造だけを初期の`verified`候補にしています。

Yi Baiのbulk artifactはruntimeへ自動importせず、Calibration用lv0とKnown resolution評価用lv2を混同しません。
