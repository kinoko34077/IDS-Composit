# Phase 8.5 / Phase 9 Hardening Record

日付: 2026-09-09 JST

## Phase 8.5 Gate

|項目|結果|根拠|
|---|---|---|
|nested glyph scale|PASS|`tests/renderer/dom-renderer.test.ts` が `⿰木⿱日月` と二段nested `⿳⿰木可⿰日月火` の実scale値を検証|
|Phase 6 visual validation|PASS|`docs/validation/PHASE_06_VISUAL_VALIDATION.md` に4 font・corpus・分類を記録|
|CHISE live response|PASS|Unicode配列、`null`、HTTP/timeout/JSON/object fixtureを分類|
|browser CORS|PASS|`/chise-preflight.html` で4 probeが `200 cors`|
|責務境界|PASS|scaleはDOM Adapter、response形はCHISE Adapter、Core変更なし|

監査文にあった `⿱⿰木可日月` は現行の最小arityでは余剰operandを含むため、回帰テストには文法上有効な同等深度の `⿳⿰木可⿰日月火` を使用した。

## Phase 9 実装

### MutationObserver

公開APIに `observeIds(root, options)` を追加した。初期rootを一度処理し、動的追加nodeを直列queueで処理する。render済み `.ids-inline-glyph` subtreeはcollectorとobserverの双方で除外し、不正IDSだけのText Nodeは置換せずMutation loopを起こさない。`stop()` はdisconnectして後続mutationを処理しない。既存の `renderIds()` は変更せず利用できる。

### contenteditable policy

既定では `contenteditable` subtreeを処理しない。`renderIds(..., { contentEditable: true })` または `observeIds(..., { contentEditable: true })` で明示的に有効化できる。caret・undoを優先し、既定動作が編集領域を変更しないことをテストした。

### Cache hardening

memory cacheへTTL、最大entry数、`clear()`、`size`を追加した。既存の数値TTL引数は互換維持し、options形式も利用できる。unavailable結果は従来どおりcacheしない。

永続cacheは今回は実装しない。ブラウザStorageへ無期限にCHISE結果を保存することは、v0.1の依存境界と正本性の方針に対して必要性が確認できていないためである。必要になった時点で、TTL・version・失敗時fallbackを含む別仕様として検討する。

### Accessibility / copy

合成glyph rootへ `role="img"`、元IDSの `aria-label` を付け、内部DOMを `aria-hidden` にした。native解決は通常textのままである。単一合成glyph全体を実ブラウザで選択してcopyすると、見た目の部品列ではなく `⟦IDS⟧` をtext/plainへ設定する。複数glyphを跨ぐ範囲・部分選択の完全な再構成とcaret統合は対象外とする。

2026-09-09のbrowser実測では、validation pageの単一 `⿰木可` 選択をCtrl+Cし、clipboardから `⟦⿰木可⟧` を取得した。

### Vertical writing investigation

validation pageへ `writing-mode: vertical-rl` の試験欄を追加した。固定 `top/left` と `transform-origin: top left` は論理方向へ自動変換されないため、現状は「表示できるが縦書き用の構図保証は未検証」と分類した。Phase 9では完全対応を実装せず、対応可否を次の仕様判断へ送る。

### Performance profiling

`tests/performance/profile.test.ts` に以下の再現測定を追加した。

- 100 text nodes / 200 local IDS
- 100 CHISE IDS / 2 cache misses
- observerの動的追加とrender済みsubtree再処理防止はpublic API testで確認

測定は correctness と request重複の確認を目的とし、固定時間thresholdは設けない。現時点でindex・worker・複雑なcacheを追加する必要性は確認できなかった。

2026-09-09のWindows Node/jsdom環境での参考値は、local 100 text nodes / 200 IDS が 841.27 ms、CHISE provider 100 IDS / 2 cache misses が 255.46 msだった。これはブラウザ性能の保証値ではなく、将来比較するための基準値である。

## Phase 9.1 Release Audit

### CHISE query normalization

入力正本は変更せず、CHISE Adapterの問い合わせ時だけ構造roleに基づくposition variantを適用する。2026-09-09のlive確認ではraw `⿰水青` は `null`、variant query `⿰氵青` は `200 cors` / `['清']` だった。Adapterは前者を後者へ正規化して照合し、native解決後の `sourceIds` とlocal fallbackはraw入力を保持する。

### Bounded resolution

非同期DOM renderingは、text node全体からunique IDSを先に集約し、既定同時実行数4のbounded workerで解決する。描画順は本文順を維持し、CHISE Adapter内部でも正規化query単位でin-flight requestを重複排除する。resolver失敗時は該当箇所だけraw `⟦IDS⟧`へ戻す。

### Browser copy scope

実ブラウザで単一の合成glyph全体を選択してCtrl+Cした結果、clipboardは `⟦⿰木可⟧` になった。これは単一glyph全体の選択に限定したv0.1保証であり、複数glyphを跨ぐ選択、部分選択、caret統合は対象外である。

### Release metadata and CI

公開packageのlicenseをMITとして `package.json` と `LICENSE` に明記した。CIはtest、typecheckに加えてlibrary buildと`npm pack --dry-run`によるpackage contents checkを実行する。GitHub Actionsでは対象commitのrun statusを確認してからRelease Candidate判定とする。

2026-09-09 JST、対象commit `3b36e3e7279ed865a9a806c581822ca41491b5cb` のGitHub Actions `CI #9` はcompleted successfullyとなった。したがって本commit時点のv0.1 Release Candidate gateをPASSと判定する。

## 回帰コマンド

```text
npm test -- --run
npm run typecheck
npm run build
npm run pack:check
```
