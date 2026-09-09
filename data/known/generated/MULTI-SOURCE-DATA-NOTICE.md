# Multi-source Known data notice

`known-index-v0.2.json`は、CHISE IDS、BabelStone IDS、Yi Bai IDS lv2の各optional artifactを決定的にmergeした検証用データです。

- pairの重複はdedupeする
- 同一characterの複数IDSは別mappingとして保持する
- 同一IDSの複数characterはambiguityとして保持し、majority voteを行わない
- 各mappingの`sourceIndexes`とtop-level `sources`で由来Sourceを追跡する

CHISE-derived dataはGPL-2.0-or-later、BabelStone-derived dataは上流`IDS.TXT`の利用条件、Yi Bai-derived dataはMITです。統合artifactの再配布・利用時は、各noticeとartifactの`source(s)` metadataを確認してください。

このartifactはnpm runtime packageやdefault bundleへ自動同梱しません。利用側が明示的に読み込み、`entriesFromKnownRecordsArtifact()`でhydrateした場合だけruntime Known Indexへ投入できます。
