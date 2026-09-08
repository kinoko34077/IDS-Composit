# Requirement Traceability

|Requirement|主実装領域|主テスト|
|---|---|---|
|REQ-001|`src/chise/chise-provider.ts`, `src/chise/normalize-response.ts`|`tests/chise/chise-provider.test.ts`, `tests/chise/normalize-response.test.ts`（live smokeは任意）|
|REQ-002|`src/parser/scan-source.ts`, `src/parser/parse-ids.ts`|`tests/parser/scan-source.test.ts`, `tests/parser/parse-ids.test.ts`|
|REQ-003|`src/resolver/resolve-ids.ts`|`tests/resolver/resolve-ids.test.ts`|
|REQ-004|`src/composition/layout.ts`|`tests/composition/layout.test.ts`|
|REQ-005|`src/renderer/dom-renderer.ts`, `src/renderer/styles.css`|`tests/renderer/dom-renderer.test.ts`|
|REQ-006|`examples/basic.html`|実ブラウザ visual check（手動）|
|REQ-007|`src/parser/parse-ids.ts`, `src/composition/layout.ts`|Parser nested test, Composition nested layout test|
|REQ-008|`src/variants/resolve-variant.ts`, `src/data/variants.ts`|`tests/variants/resolve-variant.test.ts`|
|REQ-009|`src/variants/resolve-variant.ts`|unknown role/base fallback test|
|REQ-010|`src/data/layout-templates.ts`（`⿰`/`⿱`/`⿴`/`⿲`/`⿳`）|`tests/composition/layout.test.ts`|
|REQ-011|`src/data/idc.ts`, `src/data/layout-templates.ts`, `src/data/variants.ts`|data boundary assertions in unit tests|
|REQ-012|`src/core/types.ts` and module boundaries|typecheck, architecture review|
|REQ-013|`src/chise/chise-provider.ts`, `src/resolver/resolve-ids.ts`|HTTP/timeout/unavailable tests, resolver fallback test|
|REQ-014|`src/renderer/dom-renderer.ts`|invalid IDS and renderer failure fallback tests|
|REQ-015|Phase 8: Packaging（未実装）|Phase 8 consumer demo（未実装）|

Phase 0〜4の実装済み項目は実ファイルとテストへ対応付けています。未実装項目は対象Phaseを明示しています。
