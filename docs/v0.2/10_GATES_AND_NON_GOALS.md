# v0.2 Gates and Non-goals

## Completion gates

- 14 spatial IDCのparse、arity、roles、layout、DOM、invalid arityを確認する。
- Known Indexにprovenance、verified/candidate、many-to-many、ambiguity handlingがある。
- 外部provenance付きverified entryを注入したIndexでnative解決できる（CHISE IDS初回sourceでは`⿴行圭 → 街`）。defaultの手動seed`⿲彳圭亍 → 街`はcandidateとしてnative/Calibrationから除外する。
- `⟦⿵門日⟧`をlocal compositionできる。
- Calibrationは同条件native/composition比較、文字単位optimization、profile生成、holdout評価を分離する。
- v0.1 compatibility、Pages/browser、typecheck、build、packを通す。

## Non-goals

独自文字ontology、Generic Glyph Registry、CHISE全体再実装、独自CID、PUA、font生成、IME、OS fallback hook、runtime Canvas/SVG、KAGE、画数AI、無制限の手動座標登録は実装しない。
