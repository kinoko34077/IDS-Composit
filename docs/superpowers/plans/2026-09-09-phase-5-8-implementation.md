# IDS-Composit Phase 5-8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CHISE連携、観測可能なvisual validation、必要な三項IDC、利用者向けESM/browser packageを追加してPhase 8 Gateまで到達する。

**Architecture:** `CharacterKnowledgeProvider`と`resolveIds`を新設し、CHISEの`ids-match` responseを最小の`IdsMatchResult`へ正規化する。非同期の公開DOM APIはresolverを通じてnativeまたは既存のpure compositionへ流し、同期rendererはネットワークなしの互換経路として保持する。Phase 6/7の成果はsample corpusとdata-driven IDC tableへ戻し、Phase 8は公開APIとVite library buildだけを公開する。

**Tech Stack:** TypeScript、Vitest、jsdom、native Fetch、Vite library build、npm package exports、HTML/CSS consumer demo。

**Spec:** `docs/superpowers/specs/2026-09-09-phase-5-8-design.md`, `docs/01_REQUIREMENTS.md`, `docs/02_ARCHITECTURE.md`, `docs/03_CHISE_DEPENDENCY.md`, `docs/08_TEST_AND_ACCEPTANCE.md`, `docs/09_ROADMAP.md`。

## Global Constraints

- CHISE APIの既定endpointは`https://api.chise.org/v0/character/ids-match`。
- JSON `null`はno-match、Unicode文字列だけをnative候補、非UCSのCHISE文字オブジェクトはlocal compositionへ送る。
- timeout、HTTPエラー、JSON形状エラーはunavailableとして扱い、unavailableをcacheしない。
- Parser、Role/Variant/Layout coreはDOM、CSS、CHISE HTTPへ依存しない。
- IDC・role・layout・variantは既存のdata-driven境界へ追加し、全17 IDCを先回り実装しない。
- SVG、Canvas、KAGE、Glyph Registry、独自文字DB、大量CHISE data同梱は行わない。
- すべてのproduction code変更は、先に失敗するbehavior testを追加し、その失敗を確認してから実装する。

---

### Task 1: Phase 5 CHISE response normalization and cache

**Files:**
- Create: `src/chise/types.ts`
- Create: `src/chise/normalize-response.ts`
- Create: `src/chise/cache.ts`
- Create: `tests/chise/normalize-response.test.ts`
- Create: `tests/chise/cache.test.ts`

**Interfaces:**
- Produces `IdsMatchResult`, `CharacterKnowledgeProvider`, and `ChiseProviderOptions` types in `src/chise/types.ts`.
- Produces `normalizeIdsMatchResponse(payload: unknown): IdsMatchResult`.
- Produces `MatchCache` with `get(key: string): IdsMatchResult | undefined` and `set(key: string, result: IdsMatchResult): void`, plus `createMemoryMatchCache(ttlMs?: number): MatchCache`.

- [ ] **Step 1: Write the failing normalization tests**

```ts
it('normalizes a Unicode string as a native match', () => {
  expect(normalizeIdsMatchResponse('字')).toEqual({ found: true, text: '字', raw: '字' });
});

it('normalizes null as a no-match', () => {
  expect(normalizeIdsMatchResponse(null)).toEqual({ found: false });
});

it('sends a non-UCS CHISE object to composition', () => {
  expect(normalizeIdsMatchResponse({ '@type': 'genre:character', '@id': 'abstract-glyph:cns/1' })).toEqual({ found: false });
});
```

- [ ] **Step 2: Run the normalization test and verify the expected missing-module failure**

Run: `npx vitest run tests/chise/normalize-response.test.ts`
Expected: FAIL because `src/chise/normalize-response.ts` does not exist.

- [ ] **Step 3: Write the failing cache tests**

```ts
it('returns a cached match before TTL expiry', () => {
  const cache = createMemoryMatchCache(1000);
  cache.set('⿰木可', { found: true, text: '某' });
  expect(cache.get('⿰木可')).toEqual({ found: true, text: '某' });
});

it('does not cache unavailable results', () => {
  const cache = createMemoryMatchCache(1000);
  cache.set('⿰木可', { found: false, unavailable: true });
  expect(cache.get('⿰木可')).toBeUndefined();
});
```

- [ ] **Step 4: Run the cache test and verify the expected missing-module failure**

Run: `npx vitest run tests/chise/cache.test.ts`
Expected: FAIL because `src/chise/cache.ts` does not exist.

- [ ] **Step 5: Implement the minimal response normalizer and TTL cache**

Accept a non-empty string as `{ found: true, text, raw: payload }`, `null` as `{ found: false }`, and an object with `@type: 'genre:character'` plus string `@id` or `id` as `{ found: false }`. Throw for other JSON shapes so the HTTP adapter can classify them as unavailable. Store only `found: true` and ordinary `found: false` results with their expiry timestamp.

- [ ] **Step 6: Run both focused tests and typecheck**

Run: `npx vitest run tests/chise/normalize-response.test.ts tests/chise/cache.test.ts` and `npm run typecheck`
Expected: PASS with no type errors.

- [ ] **Step 7: Commit the isolated CHISE data-boundary work**

```bash
git add src/chise tests/chise
git commit -m "feat: add chise response boundary and cache"
git push origin main
```

### Task 2: Phase 5 HTTP Adapter and resolver

**Files:**
- Create: `src/chise/chise-provider.ts`
- Create: `src/resolver/resolve-ids.ts`
- Create: `src/resolver/index.ts`
- Create: `tests/chise/chise-provider.test.ts`
- Create: `tests/resolver/resolve-ids.test.ts`
- Modify: `src/core/types.ts`
- Modify: `docs/10_CURRENT_STATE.md`
- Modify: `docs/12_TRACEABILITY.md`

**Interfaces:**
- Produces `createChiseProvider(options?: ChiseProviderOptions): CharacterKnowledgeProvider`.
- `ChiseProviderOptions` includes `endpoint?: string`, `fetch?: FetchLike`, `timeoutMs?: number`, and `cache?: MatchCache`.
- Produces `resolveIds(ids: string, provider?: CharacterKnowledgeProvider): Promise<Resolution>`.

- [ ] **Step 1: Write the failing HTTP adapter tests**

```ts
it('requests the encoded IDS and returns a native match', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify('字'), { status: 200 }));
  const provider = createChiseProvider({ fetch: fetcher, endpoint: 'https://example.test/ids-match' });
  await expect(provider.matchIds('⿰木可')).resolves.toMatchObject({ found: true, text: '字' });
  expect(fetcher.mock.calls[0]?.[0].toString()).toBe('https://example.test/ids-match?ids=%E2%BF%B0%E6%9C%A8%E5%8F%AF');
});

it('classifies timeout and HTTP failure as unavailable', async () => {
  const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('network down'));
  const provider = createChiseProvider({ fetch: fetcher, timeoutMs: 10 });
  await expect(provider.matchIds('⿰木可')).resolves.toMatchObject({ found: false, unavailable: true });
});
```

- [ ] **Step 2: Run the adapter test and verify the expected missing-module failure**

Run: `npx vitest run tests/chise/chise-provider.test.ts`
Expected: FAIL because the provider module does not exist.

- [ ] **Step 3: Write the failing resolver tests**

```ts
it('prefers a CHISE native match', async () => {
  const provider = { matchIds: vi.fn().mockResolvedValue({ found: true, text: '字' }) };
  await expect(resolveIds('⿰木可', provider)).resolves.toEqual({ kind: 'native', text: '字', sourceIds: '⿰木可' });
});

it('composes on no-match and preserves an unavailable diagnostic', async () => {
  const provider = { matchIds: vi.fn().mockResolvedValue({ found: false, unavailable: true }) };
  const result = await resolveIds('⿰木可', provider);
  expect(result.kind).toBe('compose');
  expect(result).toMatchObject({ sourceIds: '⿰木可', diagnostic: { kind: 'chise-unavailable' } });
});
```

- [ ] **Step 4: Run the resolver test and verify the expected missing-module failure**

Run: `npx vitest run tests/resolver/resolve-ids.test.ts`
Expected: FAIL because the resolver module and diagnostic type do not exist.

- [ ] **Step 5: Implement the HTTP adapter with injected fetch, timeout, normalization, and cache**

Build the URL with `URL.searchParams`, use `AbortController`, clear the timer in `finally`, return unavailable for non-2xx, fetch rejection, abort, JSON parsing failure, or normalizer failure, and cache only native/no-match results under the NFC-normalized IDS source.

- [ ] **Step 6: Implement `resolveIds` and extend the resolution diagnostic type**

Parse before calling the provider. Return native for `found: true`, compose for no-match, compose with `{ kind: 'chise-unavailable' }` for unavailable, and unresolved for parse errors. If no provider is given, return local composition without a CHISE diagnostic.

- [ ] **Step 7: Run Phase 5 tests and all existing tests**

Run: `npx vitest run tests/chise tests/resolver` and `npm test -- --run` and `npm run typecheck`
Expected: all tests pass; existing Phase 0-4 tests remain green.

- [ ] **Step 8: Update current state/traceability and commit/push Phase 5**

Record Phase 5 as implemented with live smoke explicitly optional and map REQ-001/003/013 to the concrete files and tests.

```bash
git add src/core/types.ts src/chise src/resolver tests/chise tests/resolver docs/10_CURRENT_STATE.md docs/12_TRACEABILITY.md
git commit -m "feat: add chise adapter and ids resolver"
git push origin main
```

### Task 3: Phase 6 validation corpus and evidence

**Files:**
- Create: `examples/validation.html`
- Create: `examples/validation.ts`
- Create: `docs/validation/PHASE_06_VISUAL_VALIDATION.md`
- Modify: `examples/basic.html`
- Modify: `docs/10_CURRENT_STATE.md`

**Interfaces:**
- Produces a browser page that renders the fixed corpus via the public/local renderer and offers `serif`, `sans-serif`, and `monospace` font stacks.
- Produces a written corpus and classification record without adding per-glyph optical correction.

- [ ] **Step 1: Add the validation sample content and run the dev server route check**

The page must include these currently supported literal sources: `⟦⿰木可⟧`, `⟦⿰水青⟧`, `⟦⿱艹明⟧`, `⟦⿴囗王⟧`, `⟦⿰木⿱日月⟧`, `⟦⿰鬱青⟧`, and `⟦⿱龜心⟧`. The `⿲` and `⿳` examples are added to the page in Task 4 after their data tables exist.

Run: `npm run dev -- --host 127.0.0.1`
Expected: Vite serves `/validation.html`; stop the server after the route returns HTTP 200.

- [ ] **Step 2: Record the visual validation protocol and current findings**

Document the corpus, three font stacks, nested/high-density cases, and the six classification axes. Record that fixed-ratio layout is retained for Phase 7 and that detailed visual judgment remains a manual browser check when no automated screenshot harness is available.

- [ ] **Step 3: Update sample copy and Current State**

Point `basic.html` at the Phase 5-capable local/public flow, record Phase 6 evidence status, and leave unverified visual judgments explicitly marked manual.

- [ ] **Step 4: Run typecheck and commit/push Phase 6 evidence**

```bash
npm run typecheck
git add examples docs/validation docs/10_CURRENT_STATE.md
git commit -m "docs: add phase 6 visual validation corpus"
git push origin main
```

### Task 4: Phase 7 three-part IDC coverage

**Files:**
- Modify: `src/data/idc.ts`
- Modify: `src/data/layout-templates.ts`
- Modify: `tests/parser/parse-ids.test.ts`
- Modify: `tests/composition/layout.test.ts`
- Modify: `tests/renderer/dom-renderer.test.ts`
- Modify: `docs/10_CURRENT_STATE.md`
- Modify: `docs/12_TRACEABILITY.md`

**Interfaces:**
- Adds `⿲` with roles `left/middle/right` and three equal horizontal slots.
- Adds `⿳` with roles `top/middle/bottom` and three equal vertical slots.
- Existing `getChildRoles`, parser, composer, and renderer consume the new data without operator-specific code branches.

- [ ] **Step 1: Write the failing parser/layout/render tests**

```ts
it('parses a three-child left-middle-right IDS', () => {
  expect(parseIds('⿲彳圭亍')).toEqual({ ok: true, ast: {
    type: 'composition', operator: '⿲',
    children: [{ type: 'char', value: '彳' }, { type: 'char', value: '圭' }, { type: 'char', value: '亍' }],
  }});
});

it('places three horizontal children in thirds', () => {
  const layout = composeLayout({ type: 'composition', operator: '⿲', children: [
    { type: 'char', value: '彳' }, { type: 'char', value: '圭' }, { type: 'char', value: '亍' },
  ]});
  expect(layout.children.map((child) => child.box)).toEqual([
    { x: 0, y: 0, width: 1 / 3, height: 1 },
    { x: 1 / 3, y: 0, width: 1 / 3, height: 1 },
    { x: 2 / 3, y: 0, width: 1 / 3, height: 1 },
  ]);
});
```

- [ ] **Step 2: Run the new tests and verify they fail before data changes**

Run: `npx vitest run tests/parser/parse-ids.test.ts tests/composition/layout.test.ts tests/renderer/dom-renderer.test.ts`
Expected: the new `⿲`/`⿳` cases fail as unsupported operators or missing templates.

- [ ] **Step 3: Add only the three-part IDC data and extend the validation sample**

Add arity 3 and role arrays to `src/data/idc.ts`, geometry-only third slots to `src/data/layout-templates.ts`, and the literal `⟦⿲彳圭亍⟧` / `⟦⿳士冖豆⟧` rows to `examples/validation.html`. Do not add enclosure/overlay/unary operators in this phase.

- [ ] **Step 4: Run focused tests, full tests, and typecheck**

Run: `npx vitest run tests/parser/parse-ids.test.ts tests/composition/layout.test.ts tests/renderer/dom-renderer.test.ts`, `npm test -- --run`, and `npm run typecheck`
Expected: all tests pass with nested three-part layout remaining relative to its parent.

- [ ] **Step 5: Update coverage traceability and commit/push Phase 7**

Record that Unicode identifies `⿲`/`⿳` as trinary operators and that the current implementation intentionally leaves the remaining operators pending.

```bash
git add src/data/idc.ts src/data/layout-templates.ts tests/parser/parse-ids.test.ts tests/composition/layout.test.ts tests/renderer/dom-renderer.test.ts docs/10_CURRENT_STATE.md docs/12_TRACEABILITY.md
git commit -m "feat: expand ids coverage for trinary operators"
git push origin main
```

### Task 5: Phase 8 public API and asynchronous DOM resolution

**Files:**
- Create: `src/public-api.ts`
- Modify: `src/renderer/dom-renderer.ts`
- Modify: `src/adapters/dom/index.ts`
- Create: `tests/public-api/public-api.test.ts`
- Modify: `examples/basic.ts`
- Modify: `examples/basic.html`

**Interfaces:**
- Produces `renderIds(root: HTMLElement, options?: RenderIdsOptions): Promise<void>`.
- `RenderIdsOptions` accepts `chise?: boolean`, `provider?: CharacterKnowledgeProvider`, and `chiseOptions?: ChiseProviderOptions`.
- `renderIds` preserves raw invalid/failed sources, inserts native text for native resolutions, and renders composition resolutions through the existing DOM renderer.

- [ ] **Step 1: Write the failing public API tests**

```ts
it('renders a native provider result without exposing parser details', async () => {
  const root = document.createElement('p');
  root.textContent = 'A⟦⿰木可⟧B';
  await renderIds(root, { provider: { matchIds: async () => ({ found: true, text: '字' }) } });
  expect(root.textContent).toBe('A字B');
  expect(root.querySelector('.ids-inline-glyph')).toBeNull();
});

it('composes when provider is unavailable and preserves malformed source', async () => {
  const root = document.createElement('p');
  root.textContent = 'A⟦⿰木可⟧ C⟦⿰木⟧';
  await renderIds(root, { provider: { matchIds: async () => ({ found: false, unavailable: true }) } });
  expect(root.textContent).toContain('A木可');
  expect(root.textContent).toContain('C⟦⿰木⟧');
  expect(root.querySelectorAll('.ids-inline-glyph')).toHaveLength(1);
});
```

- [ ] **Step 2: Run the public API test and verify the expected missing-export failure**

Run: `npx vitest run tests/public-api/public-api.test.ts`
Expected: FAIL because `src/public-api.ts` and the async rendering path do not exist.

- [ ] **Step 3: Implement async segment rendering and public options**

Factor the existing text-node collection into a resolver-aware async path. Use the supplied provider, a created CHISE provider, or local composition according to options. Keep raw fallback around each failing segment and leave `SCRIPT`, `STYLE`, and `TEXTAREA` untouched.

- [ ] **Step 4: Run public API tests and the complete suite**

Run: `npx vitest run tests/public-api/public-api.test.ts`, `npm test -- --run`, and `npm run typecheck`
Expected: all tests pass and the existing synchronous renderer behavior remains unchanged.

- [ ] **Step 5: Update the example to use the consumer API**

Change `examples/basic.ts` to `void renderIds(document.body);` and make the page copy describe the local fallback and optional CHISE mode without requiring internal modules.

### Task 6: Phase 8 ESM/browser build, package metadata, and consumer demo

**Files:**
- Create: `vite.lib.config.ts`
- Create: `tsconfig.build.json`
- Modify: `package.json`
- Modify: `README.md`
- Create: `examples/consumer.html`
- Create: `examples/consumer.ts`
- Modify: `docs/10_CURRENT_STATE.md`
- Modify: `docs/12_TRACEABILITY.md`

**Interfaces:**
- Produces `dist/ids-composit.js`, `dist/ids-composit.css`, and declaration output under `dist/types`.
- Package exports `.` for ESM/types and `./style.css` for the generated CSS asset.
- Consumer demo imports only the package entry and calls `renderIds(document.body)`.

- [ ] **Step 1: Write the failing build/package verification**

```ts
it('exposes the consumer entrypoint exports', async () => {
  const api = await import('../../src/public-api');
  expect(api.renderIds).toBeTypeOf('function');
});
```

Run: `npm run build`
Expected: FAIL because the library config, build tsconfig, build script, and public entrypoint are absent.

- [ ] **Step 2: Add the minimal Vite library and declaration configurations**

Use `src/public-api.ts` as the ESM entry, emit one ES bundle and CSS asset, and use a separate declaration-only `tsconfig.build.json` so tests/examples are excluded from package declarations.

- [ ] **Step 3: Add package metadata and consumer-only demo**

Set `private` to `false`, add `build` and `pack:check` scripts, `files: ['dist', 'README.md']`, exports for ESM/types/style, and a consumer HTML that imports the package entry without importing `src/parser`, `src/composition`, or `src/chise`.

- [ ] **Step 4: Run the build and inspect the output**

Run: `npm run build`, `npm pack --dry-run`, and `Get-ChildItem dist -Recurse`.
Expected: build exits 0, dry-run contains the bundle/CSS/types and excludes source test corpus, and the JavaScript bundle has no CHISE data table.

- [ ] **Step 5: Update README, Current State, traceability, and roadmap status**

Document the exact consumer setup, async `renderIds` call, optional `chise: true`, injected provider testing, local fallback behavior, and the remaining Phase 9 hardening items. Mark Phase 5〜8 as implemented only after all verification commands pass.

- [ ] **Step 6: Run final verification and commit/push**

```bash
npm test -- --run
npm run typecheck
npm run build
npm pack --dry-run
git diff --check
git add package.json package-lock.json vite.lib.config.ts tsconfig.build.json src/public-api.ts src/renderer/dom-renderer.ts src/adapters/dom/index.ts tests/public-api examples README.md docs
git commit -m "feat: package ids renderer through phase 8"
git push origin main
```

## Final Verification

- Run the complete Vitest suite and record the exact test count.
- Run `npm run typecheck` and `npm run build` from a clean working tree.
- Run `npm pack --dry-run` and confirm only intended package artifacts are listed.
- Run the Vite route check for `validation.html` and `consumer.html`.
- Confirm `git status --short --branch` is clean and `git ls-remote origin refs/heads/main` equals the pushed commit.
- Update `docs/10_CURRENT_STATE.md` so implemented, manually validated, and deferred items remain distinct.
