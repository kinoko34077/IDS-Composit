# Known Character Index

## Purpose

CHISEで見つからないIDSと、既存Unicode文字の対応穴を補完する出典付きIndex。独自ontology、Glyph Registry、CHISE代替DBではない。

## Entry

```ts
type KnownCharacterEntry = {
  ids: string;
  character: string;
  source: string;
  sourceVersion?: string;
  retrievalMethod?: string;
  sourceHash?: string;
  status: 'verified' | 'candidate';
};
```

内部では`IDS → Character[]`と`Character → IDS[]`のmany-to-manyを許可する。`generated/`と`manual/`を分離し、生成データへ人手修正を直接書き込まない。

## Resolution rule

verified候補が一つだけならnative characterを返す。verified候補が複数ならambiguousとして確定せず、次のresolverまたはcompositionへ進む。candidateは明示的な検証なしにnative解決へ使わない。

`verified`は外部資料で照合済みのentryだけに使う。少なくとも`source`、`sourceVersion`、`retrievalMethod`を保持し、可能なら取得元ファイルのhashも保持する。仕様書や手動登録だけのentryは、外部照合が済むまで`candidate`とする。

現在の初期seed `⿲彳圭亍 → 街`はIDS-Composit内の手動seedに過ぎないため`candidate`であり、default native解決・Calibration教師データには使わない。外部資料を取得して生成するbulk indexは`data/known/generated/`へ分離し、core runtimeへ直接importしない。

外部資料の取り込みは`tools/known/import-chise-ids.ts`のsource-specific importerと`tools/known/generate-index.ts`の決定的generatorを入口とする。初期sourceはCHISE IDSの抽象文字ファイル16本で、機能IDSだけをverified recordとして取り込む。`@apparent=`はCHISEが機能構造ではないと定義しているためKnown mappingへ昇格しない。機能IDS欠損でapparent値だけがある行はwarningとしてreportへ残す。

bulk artifactは`ids-composit-known-records/v0.2`のcompact形式（source metadata一回＋records）で`data/known/generated/`へ置く。`entriesFromKnownRecordsArtifact()`によるhydrateと`createKnownCharacterIndex()`への投入は利用側の明示操作に限り、runtimeは生成ディレクトリを自動importしない。CHISE IDS由来データのライセンスはartifact内noticeで管理し、MITのnpm runtime packageへ含めない。

初回固定sourceはCHISE IDS revision `352e13378e411c322cfa16bfd7a6d21d670d7eca`（snapshot `2026-07-29`）。取り込みreportでは101,995 records、unique IDS 101,833、ambiguity 160、重複0、一意解決率99.842880%を記録している。`街`はsource原文の`⿴行圭`としてverifiedになり、手動seedの`⿲彳圭亍`とは意味的canonicalizationを行わず別mappingとして扱う。
