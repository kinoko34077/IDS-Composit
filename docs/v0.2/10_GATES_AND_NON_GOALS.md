# v0.2 Gates and Non-goals

## Completion gates

- 14 spatial IDCのparse、arity、roles、layout、DOM、invalid arityを確認する。
- Known Indexにprovenance、verified/candidate、many-to-many、ambiguity handlingがある。
- CHISE・BabelStone・Yi Bai lv0/lv1/lv2をsource-specific importerで固定revision/hash付きに生成し、各Sourceのlicense noticeとmalformed auditを保持する。
- Multi-Source mergeが同一pairをdedupeし、同一characterの複数IDSを保持し、同一IDSの複数characterをambiguityとして報告する。`⿴行圭 → 街`と`⿲彳圭亍 → 街`の双方を明示hydrate後にnative resolveできる。
- Resolver用Known artifactとCalibration用corpusを分離し、lv0/lv1/lv2を無条件にverified unionしない。
- 外部provenance付きverified entryを注入したIndexでnative解決できる（CHISE IDS初回sourceでは`⿴行圭 → 街`）。defaultの手動seed`⿲彳圭亍 → 街`はcandidateとしてnative/Calibrationから除外する。
- `⟦⿵門日⟧`をlocal compositionできる。
- Calibrationは同条件native/composition比較、文字単位optimization、profile生成、holdout評価を分離する。
- v0.1 compatibility、Pages/browser、typecheck、build、packを通す。

## Non-goals

独自文字ontology、Generic Glyph Registry、CHISE全体再実装、独自CID、PUA、font生成、IME、OS fallback hook、runtime Canvas/SVG、KAGE、画数AI、無制限の手動座標登録は実装しない。Source間のIDS差を勝手にcanonicalizeして消すこと、majority voteによるambiguity解消、CHISE-derived dataのMIT扱い、巨大Known artifactのnpm runtime自動同梱も行わない。
