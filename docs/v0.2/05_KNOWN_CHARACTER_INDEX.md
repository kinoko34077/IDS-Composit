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

外部資料の取り込みは`tools/known/generate-index.ts`の決定的generatorを入口とする。generatorは取得処理やCHISE問い合わせを行わず、source metadataを付けたoptional JSON artifactを生成する。runtimeへbulk artifactを自動importする処理は持たない。
