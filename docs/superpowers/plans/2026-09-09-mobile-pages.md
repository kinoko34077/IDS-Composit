# Mobile GitHub Pages Verification Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a mobile-friendly GitHub Pages verification surface for IDS-Composit without changing the library API or runtime semantics.

**Architecture:** Add a small example playground that owns only UI state and delegates IDS rendering to the existing public `renderIds` API. Build all example HTML files with a dedicated Vite config using the repository base path, then deploy the generated static directory through a workflow separate from library CI.

**Tech Stack:** TypeScript, Vite multi-page build, existing `renderIds` API, GitHub Pages artifact/deploy actions, Vitest/jsdom for model and DOM behavior tests.

**Spec:** `docs/superpowers/specs/2026-09-09-mobile-pages-design.md`

## Global Constraints

- Existing library build, public API, IDS syntax, AST, Layout Model, CHISE Adapter, and `ci.yml` behavior remain unchanged.
- Pages output is built under `base: '/IDS-Composit/'` and written to `pages-dist/`.
- The playground delegates parsing and fallback to `renderIds`; it does not create an IDS database or parser.
- User-entered text is inserted with DOM APIs and `textContent`, never as untrusted `innerHTML`.
- Existing basic, validation, chise-preflight, and consumer examples remain reachable from the Pages entry.
- GitHub Pages deploy uses only `pages: write` and `id-token: write` in its job permissions.

---

### Task 1: Playground model and test

**Files:**
- Create: `examples/playground-model.ts`
- Test: `tests/examples/playground-model.test.ts`

**Interfaces:**
- Produces `PATTERN_CASES`, `PatternCase`, and `toDisplaySource(value: string): string` for the browser UI.
- `toDisplaySource` trims input, preserves an existing `⟦...⟧` wrapper, wraps raw IDS input, and returns an empty string for empty input.

- [x] **Step 1: Write the failing model tests**

Test raw input, already wrapped input, whitespace trimming, empty input, and the catalog's required IDC/nested/variant/density cases.

- [x] **Step 2: Run the focused test and verify it fails because the model module is missing**

Run: `npx vitest run tests/examples/playground-model.test.ts`

- [x] **Step 3: Implement the minimal catalog and normalization function**

Use a static catalog of the existing nine visual corpus cases plus one unsupported-IDC fallback case. Keep values as source IDS strings without `⟦...⟧` wrappers.

- [x] **Step 4: Run the focused test and verify it passes**

- [x] **Step 5: Commit the model and test**

Commit message: `feat: add mobile playground pattern model`

### Task 2: Mobile playground UI

**Files:**
- Create: `examples/index.html`
- Create: `examples/index.ts`
- Create: `examples/index.css`
- Test: `tests/examples/index.test.ts`

**Interfaces:**
- `examples/index.ts` initializes the page when `#playground` exists and calls `renderIds(target, { chise })` for preview/table targets.
- The UI has input, candidate select, render button, CHISE checkbox, status region, preview region, pattern table, and links to all existing examples.

- [x] **Step 1: Write failing DOM tests for the UI contract**

Assert that the page can normalize a selected candidate into the input, creates a row for each catalog case, and invokes the injected render boundary for the preview/list. Keep library rendering mocked only at this page boundary.

- [x] **Step 2: Run the focused DOM test and verify it fails because the page module is missing**

Run: `npx vitest run tests/examples/index.test.ts`

- [x] **Step 3: Implement the mobile-first page**

Use DOM creation and `textContent` for all dynamic values. On submit, replace only the preview content with the normalized source and call `renderIds`. On candidate change, update the input and render. Generate the table from `PATTERN_CASES`; rerender it when the CHISE checkbox changes. Display non-fatal render errors in the status region.

- [x] **Step 4: Add responsive styles**

Import the existing renderer stylesheet, use a one-column control layout at narrow widths, make the table horizontally scrollable, and keep sample glyphs large enough for touch-device inspection.

- [x] **Step 5: Run the focused DOM test and verify it passes**

- [x] **Step 6: Commit the playground page**

Commit message: `feat: add mobile IDS playground`

### Task 3: Pages-specific Vite build

**Files:**
- Create: `vite.pages.config.ts`
- Modify: `package.json`

**Interfaces:**
- `npm run build:pages` builds `index.html`, `basic.html`, `validation.html`, `chise-preflight.html`, and `consumer.html` from `examples/` into `pages-dist/` with `base: '/IDS-Composit/'`.
- Existing `npm run build` continues to produce the library in `dist/`.

- [x] **Step 1: Add the Pages build script and config**

Run library build before Pages build so `consumer.ts` continues to exercise the package export from the generated library artifact.

- [x] **Step 2: Run `npm run build:pages` and verify all five HTML entrypoints and assets exist**

- [x] **Step 3: Run existing tests, typecheck, library build, and pack check**

- [x] **Step 4: Commit the Pages build configuration**

Commit message: `build: add GitHub Pages example build`

### Task 4: GitHub Pages deployment workflow and documentation

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `README.md`
- Modify: `docs/00_INDEX.md`
- Modify: `docs/10_CURRENT_STATE.md`
- Modify: `docs/12_TRACEABILITY.md`

**Interfaces:**
- `pages.yml` runs on `main` pushes and manual dispatch, builds `pages-dist/`, uploads it as a Pages artifact, and deploys it using the official Pages deployment action.
- README documents `https://kinoko34077.github.io/IDS-Composit/`, child URLs, and the one-time Settings → Pages → Source → GitHub Actions selection.

- [x] **Step 1: Add the isolated Pages workflow**

Use `permissions: contents: read, pages: write, id-token: write`, concurrency for one Pages deployment, and no changes to `ci.yml`.

- [x] **Step 2: Update the project index, Current State, README, and traceability**

- [x] **Step 3: Validate YAML syntax and inspect the workflow diff**

- [x] **Step 4: Commit and push the workflow/documentation**

Commit message: `ci: deploy mobile verification surface to Pages`

### Task 5: End-to-end verification

**Files:**
- No source changes expected.

- [x] **Step 1: Run the complete local verification gate**

Run: `npm test -- --run`, `npm run typecheck`, `npm run build`, `npm run build:pages`, `npm run pack:check`, and `git diff --check`.

- [x] **Step 2: Serve `pages-dist/` over HTTP and inspect it in a browser**

Confirm the repository-base URL, input rendering, candidate selection, table previews, CHISE toggle, and all child links.

- [x] **Step 3: Confirm GitHub Actions Pages deployment success**

Check the Pages workflow run and the published URL after propagation.

- [x] **Step 4: Confirm the working tree and remote branch are synchronized**
