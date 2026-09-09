# Pages and Validation

既存のスマートフォン入口をv0.2検証surfaceとして維持し、次を表示可能にする。

- source IDS
- resolver path（Known hit/miss、CHISE hit/miss、native/composition）
- 14 spatial IDCのcoverage一覧
- native / v0.1 fixed composition / v0.2 profile compositionの比較（dataがある場合のみ）

Calibration評価はtrainingを使わずholdoutだけで判定する。v0.1 fixed templateに対し、Generic Profileのmedian lossが改善し、p75 lossが非悪化であることを採用条件とする。初回corpus取得前に閾値を推測で固定しない。

現在の入口は、直接IDS入力、候補select、local/CHISE切替、14 spatial IDC、Known candidate（`⿲彳圭亍 → 街`。未検証のためlocal composition）、local composition、未対応IDCのsource-preserving fallbackを一覧で確認できる。verified Indexを注入したresolverのnative経路はテストで確認し、表のresolver pathは現時点では期待経路の表示であるためCHISE liveの実測結果とは区別する。
