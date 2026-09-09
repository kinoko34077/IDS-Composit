# Pages and Validation

既存のスマートフォン入口をv0.2検証surfaceとして維持し、次を表示可能にする。

- source IDS
- resolver path（Known hit/miss、CHISE hit/miss、native/composition）
- 14 spatial IDCのcoverage一覧
- native / v0.1 fixed composition / v0.2 profile compositionの比較（dataがある場合のみ）

Calibration評価はtrainingを使わずholdoutだけで判定する。v0.1 fixed templateに対し、Generic Profileのmedian lossが改善し、p75 lossが非悪化であることを採用条件とする。初回corpus取得前に閾値を推測で固定しない。

現在の入口は、直接IDS入力、候補select、次の4 mode、14 spatial IDC、local composition、未対応IDCのsource-preserving fallbackを一覧で確認できる。

- `Local only`: ネットワークを使わない既定のlocal composition
- `CHISE API`: CHISE native解決を有効化し、miss時はlocalへfallback
- `Full Known Index`: Pages専用の統合Known artifactを明示ロードし、native解決を確認
- `Full Known + CHISE`: Full Knownを先に照合し、miss時だけCHISEへ進む

Full Known artifactは初期表示へ含めず、mode選択時にだけ`data/known-index-v0.2.json`から取得する。同一ページ内では読み込みPromiseを共有する。入口のtelemetryは、入力、Known lookup、CHISE照会予定、結果を表示する。Known hit時は`not queried (Known hit)`と示す。これはPages検証用の選択経路・Known lookup診断であり、CHISE live responseを捏造するものではない。

代表受入例は、CHISEの`⿴行圭 → 街`とalternate sourceの`⿲彳圭亍 → 街`をFull Known Indexへhydrateし、双方をnative resolveできることである。表のresolver pathは固定説明、入口telemetryは選択modeとKnown artifactの実測結果として区別する。
