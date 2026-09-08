# CHISE IDS Inline Renderer Phase 0-4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the current CHISE IDS Inline Renderer specification through Phase 4: typed foundation, pure IDS parsing, pure composition/layout, DOM inline rendering, and data-driven position variants.

**Architecture:** Keep parser, composition core, variant data/resolver, scanner, and DOM adapter in separate modules. Phase 0-4 will not make network calls to CHISE; the resolver boundary is reserved for Phase 5, while unresolved IDS are composed locally. The core produces relative Layout Models and the DOM adapter alone knows CSS.

**Tech Stack:** TypeScript, Vitest, jsdom, native browser DOM/CSS, Vite only if the sample page needs a dev server.

**Spec:** `docs/01_REQUIREMENTS.md`, `docs/02_ARCHITECTURE.md`, `docs/04_IDS_INPUT_AND_PARSER.md`, `docs/05_COMPOSITION_LAYOUT.md`, `docs/06_DOM_RENDERING.md`, `docs/07_VARIANT_POLICY.md`, `docs/08_TEST_AND_ACCEPTANCE.md`, and `docs/agent/PHASE_00_FOUNDATION.md` through `PHASE_04_VARIANTS.md`.

## Global Constraints

- CHISE API implementation is Phase 5 and is excluded from this plan.
- Parser, Role/Variant/Layout core modules must not import DOM, CSS, or CHISE HTTP code.
- Do not add SVG, Canvas, KAGE, Glyph Registry, independent character DB, font generation, or framework-specific rendering.
- Initial IDC data contains `⿰`, `⿱`, and `⿴`, each with arity 2.
- Layout coordinates are relative values in the 0–1 range.
- Unknown variants fall back to the base character without failing composition.
- Invalid embedded IDS preserves the original `⟦IDS⟧` source and surrounding text.

---

### Task 1: Phase 0 Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/core/types.ts`
- Create: `src/parser/index.ts`
- Create: `src/composition/index.ts`
- Create: `src/variants/index.ts`
- Create: `src/adapters/dom/index.ts`
- Create: `src/data/idc.ts`
- Create: `src/data/layout-templates.ts`
- Create: `src/data/variants.ts`
- Create: `tests/smoke/foundation.test.ts`
- Create: `examples/basic.html`
- Modify: `docs/10_CURRENT_STATE.md`

**Interfaces:**
- `src/core/types.ts` exports `StructuralRole`, `Box`, `IdsNode`, `LayoutNode`, and `Resolution`.
- Module directories expose placeholder-free entry points whose public exports can grow without reverse dependencies.

- [ ] **Step 1: Write the foundation smoke test**

```ts
import { describe, expect, it } from 'vitest';
import type { Box, IdsNode, LayoutNode, Resolution } from '../../src/core/types';

describe('foundation type surface', () => {
  it('loads the core type modules and data boundaries', async () => {
    const types: [IdsNode, LayoutNode, Resolution, Box] | null = null;
    expect(types).toBeNull();
    const idc = await import('../../src/data/idc');
    expect(idc.IDC_ARITY['⿰']).toBe(2);
  });
});
```

- [ ] **Step 2: Run the smoke test and verify the foundation is not yet configured**

Run: `npm test -- --run tests/smoke/foundation.test.ts`
Expected: FAIL because the TypeScript/Vitest project and modules do not exist yet.

- [ ] **Step 3: Add the minimal TypeScript/Vitest configuration and core type declarations**

Use `moduleResolution: "Bundler"`, strict type checking, ESM, and Vitest globals disabled. Define `IdsNode` as recursive `char | composition`, `LayoutNode` as recursive `glyph | composition`, and `Resolution` as `native | compose | unresolved` without CHISE response types.

- [ ] **Step 4: Add the data skeleton, module entry points, and sample page**

Keep the IDC, layout, and variant tables in data modules. Entry points must not import DOM or network modules. The sample page only demonstrates the future integration boundary and contains no renderer implementation.

- [ ] **Step 5: Run the foundation test and typecheck**

Run: `npm test -- --run tests/smoke/foundation.test.ts` and `npm run typecheck`
Expected: PASS with no test or type errors.

- [ ] **Step 6: Update Current State and commit**

Record that Phase 0 is implemented and Phase 1 is next. Commit with `feat: add phase 0 foundation`.

### Task 2: Phase 1 Pure IDS Parser

**Files:**
- Create: `src/parser/parse-ids.ts`
- Create: `src/parser/scan-source.ts`
- Create: `src/parser/errors.ts`
- Create: `tests/parser/parse-ids.test.ts`
- Create: `tests/parser/scan-source.test.ts`
- Modify: `src/parser/index.ts`
- Modify: `src/core/types.ts`
- Modify: `docs/10_CURRENT_STATE.md`

**Interfaces:**
- `parseIds(source: string): ParseResult`, where success returns `{ ok: true, ast: IdsNode }` and failure returns `{ ok: false, error: ParseError }`.
- `scanEmbeddedIds(text: string): TextSegment[]`, where segments are `{ type: 'text', value }` or `{ type: 'ids', source, raw }` or `{ type: 'invalid', raw, error }`.
- `ParseError` includes `kind: 'empty' | 'unknown-operator' | 'missing-child' | 'trailing-input'` and a character index.

- [ ] **Step 1: Write failing parser and scanner tests**

Cover `⿰木可`, nested `⿰木⿱日月`, empty input, missing child, trailing input, unknown operator, and `AAA⟦⿰木可⟧BBB` preserving both text segments.

- [ ] **Step 2: Run parser tests and verify expected failures**

Run: `npm test -- --run tests/parser`
Expected: FAIL because parser and scanner functions are not implemented.

- [ ] **Step 3: Implement recursive parsing and delimiter scanning**

Read Unicode code points for leaves with `Array.from`, use `IDC_ARITY` for operator arity, reject extra tokens, and never perform DOM/CHISE/layout work. Scanner must preserve raw delimiters for invalid input and leave text outside delimiters unchanged.

- [ ] **Step 4: Run parser tests and typecheck**

Run: `npm test -- --run tests/parser` and `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Update Current State and commit**

Record Phase 1 completion and the parser Gate. Commit with `feat: implement pure ids parser`.

### Task 3: Phase 2 Composition and Layout Core

**Files:**
- Create: `src/composition/roles.ts`
- Create: `src/composition/layout.ts`
- Create: `tests/composition/layout.test.ts`
- Modify: `src/composition/index.ts`
- Modify: `src/core/types.ts`
- Modify: `src/data/idc.ts`
- Modify: `src/data/layout-templates.ts`
- Modify: `docs/10_CURRENT_STATE.md`

**Interfaces:**
- `getChildRoles(operator: string): StructuralRole[]`.
- `composeLayout(ast: IdsNode): LayoutNode`.
- `LayoutNode` glyph children contain `value`, `role`, and a relative `box`; composition children contain `operator`, `box`, and recursively laid-out children.

- [ ] **Step 1: Write failing role and layout tests**

Assert role mappings for `⿰`, `⿱`, `⿴`; exact 0–1 boxes for their two children; nested coordinate multiplication for `⿰木⿱日月`; and rejection of unsupported operators at the composition boundary.

- [ ] **Step 2: Run composition tests and verify expected failures**

Run: `npm test -- --run tests/composition/layout.test.ts`
Expected: FAIL because role/layout functions are not implemented.

- [ ] **Step 3: Implement data-driven role and layout composition**

Use the fixed templates from `docs/05_COMPOSITION_LAYOUT.md`: `⿰` 50/50, `⿱` 50/50, and `⿴` outer 100% plus inner 60% at 20% offsets. Recursively transform child boxes without DOM or CSS values.

- [ ] **Step 4: Run composition tests and typecheck**

Run: `npm test -- --run tests/composition/layout.test.ts` and `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Update Current State and commit**

Record Phase 2 completion and the pure `AST → Layout Model` Gate. Commit with `feat: add composition layout core`.

### Task 4: Phase 3 Scanner, DOM Adapter, and Sample Page

**Files:**
- Create: `src/renderer/dom-renderer.ts`
- Create: `src/renderer/styles.css`
- Create: `tests/renderer/dom-renderer.test.ts`
- Create: `tests/renderer/scanner-renderer.test.ts`
- Modify: `src/adapters/dom/index.ts`
- Modify: `src/parser/scan-source.ts`
- Modify: `examples/basic.html`
- Modify: `docs/10_CURRENT_STATE.md`

**Interfaces:**
- `renderIdsInElement(root: HTMLElement): void` scans text nodes outside `SCRIPT`, `STYLE`, and `TEXTAREA`.
- `renderLayout(layout: LayoutNode, document: Document, source: string): HTMLElement` returns an inline box with `data-ids` and recursively rendered child nodes.
- Renderer failures replace only the current source with raw `⟦IDS⟧` text and preserve surrounding nodes.

- [ ] **Step 1: Write failing jsdom renderer tests**

Cover multiple IDS in one paragraph, one-em parent box, `data-ids`, nested composition DOM, untouched script/style/textarea text, and invalid IDS raw fallback.

- [ ] **Step 2: Run renderer tests and verify expected failures**

Run: `npm test -- --run tests/renderer`
Expected: FAIL because the DOM adapter and renderer are not implemented.

- [ ] **Step 3: Implement scanner replacement and DOM projection**

Create text-only segments, parse and compose IDS locally, replace only eligible text nodes, and map relative boxes to CSS percentages/transforms. Use a stable class such as `ids-inline-glyph`; do not add SVG, Canvas, CHISE calls, or a framework.

- [ ] **Step 4: Add CSS and the sample page**

Define the parent as `display: inline-block; position: relative; width: 1em; height: 1em;` and child nodes as absolutely positioned. The sample page must include the five visual validation examples from the acceptance spec.

- [ ] **Step 5: Run renderer tests and typecheck**

Run: `npm test -- --run tests/renderer` and `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Update Current State and commit**

Record Phase 3 completion and mark visual browser inspection as manual if no browser automation is available. Commit with `feat: add dom inline renderer`.

### Task 5: Phase 4 Position Variants

**Files:**
- Create: `src/variants/resolve-variant.ts`
- Create: `tests/variants/resolve-variant.test.ts`
- Modify: `src/data/variants.ts`
- Modify: `src/composition/layout.ts`
- Modify: `src/composition/index.ts`
- Modify: `docs/10_CURRENT_STATE.md`

**Interfaces:**
- `resolveVariant(baseCharacter: string, role: StructuralRole, map?: VariantMap): string` returns a mapped variant or the base character.
- `composeLayout(ast: IdsNode, options?: { variantMap?: VariantMap }): LayoutNode` applies variants only to glyph leaves and preserves nested composition roles.

- [ ] **Step 1: Write failing variant tests**

Cover all seed mappings in `docs/07_VARIANT_POLICY.md`, unknown base/role fallback, and composition output where `⿰水青` emits `氵` for the left leaf.

- [ ] **Step 2: Run variant tests and verify expected failures**

Run: `npm test -- --run tests/variants`
Expected: FAIL because the resolver and variant application are not implemented.

- [ ] **Step 3: Implement the data-driven resolver**

Keep mappings in the variant data module, implement lookup without scattered conditions, and use base-character fallback. Thread the map through composition without introducing DOM or CHISE dependencies.

- [ ] **Step 4: Run the complete test suite and typecheck**

Run: `npm test -- --run` and `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Update Current State and commit/push**

Record Phase 4 completion, explicitly state that Phase 5 CHISE integration remains pending, and commit with `feat: add data-driven position variants`.

## Final Verification

- Run: `npm test -- --run`
- Run: `npm run typecheck`
- Run: `git diff --check HEAD~5..HEAD`
- Inspect `docs/10_CURRENT_STATE.md` for accurate Phase 0-4 status and Phase 5 boundary.
- Perform browser inspection of `examples/basic.html` if a local browser route is available; report it as manual if not.
