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
  status: 'verified' | 'candidate';
};
```

内部では`IDS → Character[]`と`Character → IDS[]`のmany-to-manyを許可する。`generated/`と`manual/`を分離し、生成データへ人手修正を直接書き込まない。

## Resolution rule

verified候補が一つだけならnative characterを返す。verified候補が複数ならambiguousとして確定せず、次のresolverまたはcompositionへ進む。candidateは明示的な検証なしにnative解決へ使わない。

初期seedは`⿲彳圭亍 → 街`。出典はv0.2要件資料とversionを保持する。
