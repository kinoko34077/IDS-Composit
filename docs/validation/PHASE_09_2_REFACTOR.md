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

## Targeted optimization pass

RC2の性能観測結果を受け、追加の大規模refactorは行わず、次の2点だけを実装した。

- `src/public-api.ts`: provider未指定時は`renderIdsInElement`の同期local compositionへ分岐する。provider指定時は従来どおり`renderIdsInElementAsync`とbounded batch resolveを使う。Observerにも同じrender targetを渡すため、デフォルト経路の余分なPromise workerを省く。
- `src/runtime/observe-dom.ts`: 同一MutationObserver callbackの追加をMutationRecordの親要素へ正規化し、ancestor containmentでdedupしてから直列queueへ投入する。render済みglyphだけの追加は従来どおり無視する。runtimeからrenderer実装を直接importせず、render callback境界を利用する。

公開API、IDS syntax、AST、Layout Model、CHISE fallback semantics、Supported IDC、Variant semantics、copy保証範囲、contenteditable default-offは変更していない。

### Optimization measurement

測定環境とprofile caseはBaseline/Post-refactor表と同じWindows / Node.js / Vitest 5 / jsdom。下表は2026-09-09 JSTに取得した3回分の範囲で、実行ごとの揺らぎを含む。比較対象はRC2 post-refactor値であり、値はbrowser性能の保証値ではない。

|対象|測定条件|RC2 post-refactor|optimization pass|
|---|---|---:|---:|
|local rendering|100 text nodes / 200 IDS|1196.25 ms|536.61–684.72 ms|
|local rendering|100 IDS|369.72 ms|189.61–227.39 ms|
|local rendering|1000 IDS|2966.57 ms|1806.75–2207.84 ms|
|CHISE provider|100 IDS / 2 cache misses|456.48 ms|258.52–307.75 ms|
|CHISE resolution|10 unique responses / fixture fetch|13.37 ms|5.67–7.73 ms|
|CHISE resolution|100 unique responses / fixture fetch|21.89 ms|12.68–21.84 ms|
|MutationObserver|100 dynamic additions|335.48 ms|208.43–294.36 ms|
|ESM bundle|`dist/ids-composit.js`|14.73 kB|16.01 kB|
|ESM bundle gzip|`dist/ids-composit.js` gzip|4.95 kB|5.26 kB|
|npm package|tarball / unpacked / files|11.1 kB / 29.2 kB / 35 files|11.4 kB / 30.6 kB / 35 files|

local renderingは呼び出し直後の同期経路へ分岐したことで、3回ともRC2 post-refactor値を下回った。Observerも同一callback内の100追加を親rootの1 render jobへ集約し、3回ともRC2値を下回った。CHISE有効時のprofileは今回の分岐で意味論を変更していないため、測定値の改善は参考傾向として扱い、CHISE APIの速度保証とはしない。

bundleはJS 1.28 kB、gzip 0.31 kB増加した。性能改善が明確だった対象に限定したトレードオフであり、これを相殺するための追加抽象化や複雑な最適化は入れていない。`npm audit --omit=dev --audit-level=high`はvulnerabilities 0件だった。

### Optimization gate

- local fast path: PASS（公開APIテストでawait前の描画を確認、profileで再現性のある短縮）
- MutationObserver batching: PASS（callback単位の親root集約テスト、profileで再現性のある短縮）
- public/provider semantics: PASS（full regression、typecheck、build、pack check）
- boundary: PASS（Parser/Layout/Variant/CHISE ontologyの境界を変更せず、runtimeはrender callbackだけを受け取る）

実装commit `6c016ab` のGitHub Actions `CI #17`はcompleted successfullyとなった。

CIのNode 20 deprecation warningを解消するため、workflowのみを`actions/checkout@v5` / `actions/setup-node@v5`へ更新した。CI maintenance commit `f2e8f9b` の`CI #19`はcompleted successfullyで、Annotationsは0件だった。
