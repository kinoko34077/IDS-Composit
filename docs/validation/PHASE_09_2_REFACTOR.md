# Phase 9.2 Internal Refactor Record

日付: 2026-09-09 JST

## Scope

v0.1 RCの公開API、IDS syntax、AST、Layout Model、CHISE fallback semantics、Supported IDC、Variant semantics、copy保証範囲、contenteditable default-offを変更せず、内部責務だけを分離する。

Phase 9.2では、分割前後の性能を同じprofile testで比較する。測定値の改善が確認できないmicro optimizationは採用しない。責務分離そのものによる小さな測定揺らぎは許容するが、機能回帰や明確な性能悪化は受け入れない。

## Baseline

Baseline source: tag `v0.1.0-rc1` (`56b2cad`)

測定環境: Windows / Node.js / Vitest 5 / jsdom。時間はbrowser性能の保証値ではなく、同一テストをrefactor前後で比較するための参考値である。

|対象|測定条件|baseline|
|---|---|---:|
|local rendering|100 text nodes / 200 IDS|983.88 ms|
|local rendering|100 IDS|384.16 ms|
|local rendering|1000 IDS|3072.25 ms|
|CHISE provider|100 IDS / 2 cache misses|384.50 ms|
|CHISE resolution|10 unique responses / fixture fetch|11.68 ms|
|CHISE resolution|100 unique responses / fixture fetch|26.91 ms|
|MutationObserver|100 dynamic additions|317.48 ms|
|ESM bundle|`dist/ids-composit.js`|14.20 kB|
|ESM bundle gzip|`dist/ids-composit.js` gzip|4.86 kB|
|npm package|tarball / unpacked|10.6 kB / 27.4 kB|

Profile cases are in `tests/performance/profile.test.ts`. CHISE unique resolution uses a local `null` response fixture function so the measurement isolates resolver/adapter scheduling rather than remote service latency.

## Refactor acceptance

- public API and documented v0.1 behavior remain unchanged
- full regression, typecheck, build, and package checks pass
- existing visual corpus and CHISE preflight remain unchanged
- profile test remains repeatable and does not lose IDS segments
- no new runtime dependency, registry, SVG, Canvas, font generation, or persistent CHISE database is introduced
- bundle/package size and profile results are recorded after the refactor before RC2 judgment

## Planned internal boundaries

```text
public-api.ts
  ├─ renderer/render-document.ts
  │    └─ renderer/render-layout.ts
  │         ├─ renderer/accessibility.ts
  │         └─ renderer/copy-behavior.ts
  ├─ runtime/resolve-batch.ts
  └─ runtime/observe-dom.ts
```

`src/renderer/dom-renderer.ts` は削除し、internal adapter・example・testも新しいfocused moduleを直接参照する。公開APIの入口は `src/public-api.ts` に留める。

## Post-refactor measurement

測定環境とprofile caseはbaselineと同じ。以下は2026-09-09 JSTの最終測定値である。時間は実行ごとの揺らぎが大きいため、baselineとの差を高速化の根拠とは扱わない。

|対象|測定条件|post-refactor|
|---|---|---:|
|local rendering|100 text nodes / 200 IDS|1196.25 ms|
|local rendering|100 IDS|369.72 ms|
|local rendering|1000 IDS|2966.57 ms|
|CHISE provider|100 IDS / 2 cache misses|456.48 ms|
|CHISE resolution|10 unique responses / fixture fetch|13.37 ms|
|CHISE resolution|100 unique responses / fixture fetch|21.89 ms|
|MutationObserver|100 dynamic additions|335.48 ms|
|ESM bundle|`dist/ids-composit.js`|14.73 kB|
|ESM bundle gzip|`dist/ids-composit.js` gzip|4.95 kB|
|npm package|tarball / unpacked / files|11.1 kB / 29.2 kB / 35 files|

runtime bundleはbaselineより0.53 kB（gzip 0.09 kB）増加した。これはfocused module間の小さなadapter関数とbuild時の構成差によるもので、これを相殺するための複雑な最適化は追加しない。内部compatibility barrel削除によりpackage filesは36から35へ減少し、不要な宣言を1つ除去できた。

## Refactor gate

- API surface testで `IdsObserverHandle` を含む公開型の欠落がないことを確認
- existing renderer/public-api/CHISE/observer regressionを実行
- 既存visual corpusとCHISE preflightは同一実装経路で再確認
- package size・profile値をbaselineと併記し、改善のないmicro optimizationは不採用

2026-09-09 JST、refactor commit `0364af8b1b09cf761c3da394b03ccd96b24ce0de` のGitHub Actions `CI #15` はcompleted successfullyとなった。全15 test files / 88 tests、typecheck、build、pack checkを含むRC2 gateをPASSと判定する。
