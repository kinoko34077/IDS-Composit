# Phase 8.5 / Phase 9 Hardening Record

日付: 2026-09-09 JST

## Phase 8.5 Gate

|項目|結果|根拠|
|---|---|---|
|nested glyph scale|PASS|`tests/renderer/dom-renderer.test.ts` が `⿰木⿱日月` と二段nested `⿳⿰木可⿰日月火` の実scale値を検証|
|Phase 6 visual validation|PASS|`docs/validation/PHASE_06_VISUAL_VALIDATION.md` に4 font・corpus・分類を記録|
|CHISE live response|PASS|Unicode配列、`null`、HTTP/timeout/JSON/object fixtureを分類|
|browser CORS|PASS|`/chise-preflight.html` で3 probeが `200 cors`|
|責務境界|PASS|scaleはDOM Adapter、response形はCHISE Adapter、Core変更なし|

監査文にあった `⿱⿰木可日月` は現行の最小arityでは余剰operandを含むため、回帰テストには文法上有効な同等深度の `⿳⿰木可⿰日月火` を使用した。

## Phase 9 実装

### MutationObserver

公開APIに `observeIds(root, options)` を追加した。初期rootを一度処理し、動的追加nodeを直列queueで処理する。render済み `.ids-inline-glyph` subtreeはcollectorとobserverの双方で除外し、`stop()` はdisconnectして後続mutationを処理しない。既存の `renderIds()` は変更せず利用できる。

### contenteditable policy

既定では `contenteditable` subtreeを処理しない。`renderIds(..., { contentEditable: true })` または `observeIds(..., { contentEditable: true })` で明示的に有効化できる。caret・undoを優先し、既定動作が編集領域を変更しないことをテストした。

### Cache hardening

memory cacheへTTL、最大entry数、`clear()`、`size`を追加した。既存の数値TTL引数は互換維持し、options形式も利用できる。unavailable結果は従来どおりcacheしない。

永続cacheは今回は実装しない。ブラウザStorageへ無期限にCHISE結果を保存することは、v0.1の依存境界と正本性の方針に対して必要性が確認できていないためである。必要になった時点で、TTL・version・失敗時fallbackを含む別仕様として検討する。

### Accessibility / copy

合成glyph rootへ `role="img"`、元IDSの `aria-label` を付け、内部DOMを `aria-hidden` にした。native解決は通常textのままである。合成rootのcopy eventでは、見た目の部品列ではなく `⟦IDS⟧` をtext/plainへ設定する。完全なselection/caret統合は対象外とする。

### Vertical writing investigation

validation pageへ `writing-mode: vertical-rl` の試験欄を追加した。固定 `top/left` と `transform-origin: top left` は論理方向へ自動変換されないため、現状は「表示できるが縦書き用の構図保証は未検証」と分類した。Phase 9では完全対応を実装せず、対応可否を次の仕様判断へ送る。

### Performance profiling

`tests/performance/profile.test.ts` に以下の再現測定を追加した。

- 100 text nodes / 200 local IDS
- 100 CHISE IDS / 2 cache misses
- observerの動的追加とrender済みsubtree再処理防止はpublic API testで確認

測定は correctness と request重複の確認を目的とし、固定時間thresholdは設けない。現時点でindex・worker・複雑なcacheを追加する必要性は確認できなかった。

2026-09-09のWindows Node/jsdom環境での参考値は、local 100 text nodes / 200 IDS が 841.27 ms、CHISE provider 100 IDS / 2 cache misses が 255.46 msだった。これはブラウザ性能の保証値ではなく、将来比較するための基準値である。

## 回帰コマンド

```text
npm test -- --run
npm run typecheck
npm run build
npm run pack:check
```
