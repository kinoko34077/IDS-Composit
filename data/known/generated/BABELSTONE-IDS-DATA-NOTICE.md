# BabelStone IDS data notice

`babelstone-ids-v0.2.json`は、BabelStoneが公開する`IDS.TXT`から生成したoptional bulk artifactです。

- upstream index: <https://www.babelstone.co.uk/CJK/index.html>
- upstream file: <https://www.babelstone.co.uk/CJK/IDS.TXT>
- snapshot: Unicode 16.0 / file date 2025-06-27
- usage condition: IDS dataは事実データとして個人・商用利用可能で、形式についてもcopyright claimを放棄すると上流ファイルに記載されています
- source revision / SHA-256: artifactの`source` objectおよびreportを参照

地域別タグ（`G`、`T`、`J`など）は`variantTag`として保持し、`{1}`等のunencoded componentを含むmappingは`candidate`へ分類しています。`⿾`、`⿿`、`㇯`等のlocal renderer未対応operatorを含むmappingも、構造上有効ならnative lookup用の`verified` mappingとして保持します。

このartifactはMITのnpm runtime packageへ自動同梱しません。利用条件は上流`IDS.TXT`の現行記載を確認してください。
