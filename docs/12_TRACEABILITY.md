# Requirement Traceability

|Requirement|主実装領域|主テスト|
|---|---|---|
|REQ-001|`src/chise/chise-provider.ts`, `src/chise/normalize-response.ts`|`tests/chise/chise-provider.test.ts`, `tests/chise/normalize-response.test.ts`（live smokeは任意）|
|REQ-002|`src/parser/scan-source.ts`, `src/parser/parse-ids.ts`|`tests/parser/scan-source.test.ts`, `tests/parser/parse-ids.test.ts`|
|REQ-003|`src/resolver/resolve-ids.ts`|`tests/resolver/resolve-ids.test.ts`|
|REQ-004|`src/composition/layout.ts`|`tests/composition/layout.test.ts`|
|REQ-005|`src/renderer/render-layout.ts`, `src/renderer/styles.css`|`tests/renderer/dom-renderer.test.ts`|
|REQ-006|`examples/basic.html`|実ブラウザ visual check（手動）|
|REQ-007|`src/parser/parse-ids.ts`, `src/composition/layout.ts`|Parser nested test, Composition nested layout test|
|REQ-008|`src/variants/resolve-variant.ts`, `src/data/variants.ts`|`tests/variants/resolve-variant.test.ts`|
|REQ-009|`src/variants/resolve-variant.ts`|unknown role/base fallback test|
|REQ-010|`src/data/layout-templates.ts`（`⿰`/`⿱`/`⿴`/`⿲`/`⿳`）|`tests/composition/layout.test.ts`|
|REQ-011|`src/data/idc.ts`, `src/data/layout-templates.ts`, `src/data/variants.ts`|data boundary assertions in unit tests|
|REQ-012|`src/core/types.ts` and module boundaries|typecheck, architecture review|
|REQ-013|`src/chise/chise-provider.ts`, `src/resolver/resolve-ids.ts`|HTTP/timeout/unavailable tests, resolver fallback test|
|REQ-014|`src/renderer/render-document.ts`, `src/renderer/render-layout.ts`|invalid IDS and renderer failure fallback tests|
|REQ-015|`src/public-api.ts`, `package.json`, `vite.lib.config.ts`|`tests/public-api/public-api.test.ts`, `examples/consumer.html`, package build/pack check|
|REQ-016|`src/renderer/render-layout.ts`|`tests/renderer/dom-renderer.test.ts` nested absolute scale assertions|
|REQ-017|`src/public-api.ts`, `src/runtime/observe-dom.ts`, `src/renderer/render-document.ts`|`tests/public-api/public-api.test.ts`, renderer contenteditable tests|
|REQ-018|`src/chise/cache.ts`|`tests/chise/cache.test.ts`, `tests/performance/profile.test.ts`|
|REQ-019|`src/renderer/accessibility.ts`, `src/renderer/copy-behavior.ts`, `src/renderer/render-layout.ts`|`tests/renderer/dom-renderer.test.ts` accessibility/copy assertions|
|REQ-020|`examples/validation.html`, `examples/chise-preflight.html`, `docs/validation/`|browser visual/CORS preflight record|
|REQ-021|`src/chise/query-normalizer.ts`, `src/chise/chise-provider.ts`|`tests/chise/query-normalizer.test.ts`, `tests/chise/chise-provider.test.ts` query-only position normalization and normalized in-flight key|
|REQ-022|`src/renderer/render-document.ts`, `src/runtime/resolve-batch.ts`, `src/chise/chise-provider.ts`|`tests/public-api/public-api.test.ts`, `tests/chise/chise-provider.test.ts`, `tests/runtime/resolve-batch.test.ts` bounded unique resolution and request deduplication|
|REQ-023|`src/renderer/copy-behavior.ts`, `src/renderer/render-layout.ts`|`tests/renderer/dom-renderer.test.ts`, `docs/validation/PHASE_09_HARDENING.md` real browser single-glyph selection copy record|
|REQ-025|`src/runtime/observe-dom.ts`|`tests/public-api/public-api.test.ts` malformed-only observer loop prevention|
|REQ-024|`README.md`, `package.json`, `LICENSE`, `.github/workflows/ci.yml`|Supported IDC disclosure, MIT metadata, build and package contents CI gates|
|REQ-026|`src/public-api.ts`, `src/renderer/render-document.ts`|`tests/public-api/public-api.test.ts` local provider-disabled synchronous fast path|
|REQ-027|`src/runtime/observe-dom.ts`|`tests/runtime/observe-dom.test.ts`, `tests/performance/profile.test.ts` same-callback parent batching and containment dedup|
|REQ-028|`.github/workflows/ci.yml`|GitHub Actions `CI #19` green、Node 20 deprecation warning解消のworkflow runtime更新|
|REQ-029|`examples/index.html`, `examples/index.ts`, `examples/index.css`, `examples/playground-model.ts`, `vite.pages.config.ts`, `.github/workflows/pages.yml`|`tests/examples/playground-model.test.ts`, `tests/examples/index.test.ts`, `npm run build:pages`, Pages実ブラウザ確認|
|REQ-201|`docs/v0.2/`, `AGENTS.md`, `docs/00_INDEX.md`|`docs/v0.2/00_INDEX.md`および章別レビュー|
|REQ-210|`src/core/types.ts`, `src/data/idc.ts`, `src/data/layout-templates.ts`, `src/composition/layout.ts`|`tests/composition/spatial-coverage.test.ts`, `tests/renderer/spatial-coverage.test.ts`|
|DATA-211|`src/data/idc.ts`, `src/data/layout-templates.ts`|`tests/composition/spatial-coverage.test.ts`|
|BEH-212|`src/composition/layout.ts`, `src/renderer/render-document.ts`|`tests/composition/spatial-coverage.test.ts`, `tests/renderer/spatial-coverage.test.ts`|
|DATA-220|`src/known/`, `data/known/manual/seed.json`, `tools/known/generate-index.ts`|`tests/known/index.test.ts`, `tests/known/generate-index.test.ts`, `tests/compat/v0-1-runtime.test.ts`|
|DATA-221|`src/known/index.ts`|`tests/known/index.test.ts` many-to-many lookup assertions|
|DATA-222|`data/known/generated/`, `data/known/manual/`|data layout review; generated/manual paths remain separate|
|DATA-223|`src/known/types.ts`, `data/known/manual/seed.json`, `tools/known/generate-index.ts`|`tests/known/index.test.ts`, `tests/known/generate-index.test.ts` provenance assertions|
|BEH-224|`src/resolver/resolve-chain.ts`, `src/resolver/resolve-ids.ts`, `src/public-api.ts`|`tests/resolver/resolve-chain.test.ts`, `tests/public-api/public-api.test.ts`|
|BEH-225|`src/known/index.ts`, `src/resolver/resolve-chain.ts`|`tests/known/index.test.ts`, `tests/resolver/resolve-chain.test.ts` ambiguity assertions|
|BEH-226|`src/parser/scan-source.ts`, `src/resolver/resolve-chain.ts`, `src/renderer/render-document.ts`|`tests/parser/scan-source.test.ts`, `tests/resolver/resolve-chain.test.ts`, `tests/public-api/public-api.test.ts` native-before-coverage assertions|
|DATA-227|`src/known/normalize-lookup-key.ts`, `src/known/index.ts`, `tools/known/generate-index.ts`|`tests/known/index.test.ts`, `tests/known/generate-index.test.ts` NFC/provenance/generator assertions|
|DATA-228|`tools/known/import-chise-ids.ts`, `tools/known/generate-index.ts`, `data/known/generated/`, `data/known/reports/`|`tests/known/import-chise-ids.test.ts`, `tests/known/generate-index.test.ts`, `npm run typecheck:tools`, fixed-source import report|
|DATA-229|`src/known/types.ts`, `src/known/index.ts`|`tests/known/index.test.ts` compact optional artifact hydrate and native resolve|
|CALIBRATION|`src/calibration/`, `tools/calibration/`, `data/calibration/`, `data/layout-profiles/`|`tests/calibration/metrics.test.ts`, `tests/calibration/corpus.test.ts`, `tests/calibration/generate-corpus.test.ts`, `tests/calibration/report.test.ts`, `tests/calibration/optimizer.test.ts`, `tests/calibration/profile.test.ts`|
|DATA-230|`tools/calibration/generate-corpus.ts`, `data/calibration/`|`tests/calibration/generate-corpus.test.ts`, `npm run calibration:build:corpus`, source-hash-preserving corpus report|
|PAGES-V0.2|`examples/playground-model.ts`, `examples/index.ts`, `examples/index.css`|`tests/examples/v0-2-surface.test.ts`, `npm run build:pages`|

Phase 0〜9.2およびv0.2 first sliceの実装済み項目は実ファイルとテストへ対応付けています。手動観測・次の仕様判断はvalidation recordとCurrent Stateへ分離しています。
