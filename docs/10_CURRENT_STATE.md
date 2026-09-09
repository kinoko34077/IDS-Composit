# Current State

Updated: 2026-09-09

## 現在段階

**v0.1.0 released / v0.2.0-dev.0 hardening中**

## 最新確定方針

- 文字情報基盤はCHISEへ依存する。
- IDSを入力表現として利用する。
- 独自Registryを作らない。
- 本プロジェクトは簡易Web rendering/composition layerへ限定する。
- CHISEで既存文字へ解決できればnative Unicode優先。
- 未解決なら既存Unicode部品をDOM/CSSで強引に配置する。
- `水→氵`等の位置variantを表示時に適用する。
- v0.1 fixed templateの構図比率は互換fallbackとして維持し、v0.2 profileは実データとholdout gate後に未知字へ限定適用する。
- SVG/KAGE/Canvas/font生成はruntime対象外。Canvas/SVGは`tools/calibration/`の測定用途だけ許可する。
- v0.1.0はcommit `25e0449`を正本としてtag・GitHub Release済み。v0.2作業では公開APIとv0.1挙動を互換基準として保持する。

## 実装済み

- Phase 0 Foundation: TypeScript/Vitest 基盤、Core型、IDC/Layout/Variantデータ境界、サンプルページ
- Phase 1 IDS Parser: `⟦...⟧` scanner、`⿰`/`⿱`/`⿴` の再帰Parser、parse error、本文保持 fallback
- Phase 2 Composition Core: structural role、固定Layout Template、相対座標の再帰Layout Model
- Phase 3 DOM Inline Renderer: 本文Scanner、1em inline box、入れ子DOM、script/style/textarea除外、Viteサンプルページ
- Phase 4 Position Variants: data-driven Variant Map、seed mappings、base character fallback、Compositionへのvariant適用
- Phase 4.5 Correctness: glyph本体のscale、Role/geometry分離、局所renderer fallback、README/Traceability同期、最小CI
- Phase 5 CHISE Adapter / Resolver: `ids-match` response normalization、injected fetch、timeout/HTTP/JSON failure、TTL memory cache、native優先、local composition fallback、unavailable diagnostic
- Phase 6 Visual Validation: 固定corpus、複数font切替sample、browser目視とfailure classification記録
- Phase 7 IDS Coverage: Unicode trinary IDC `⿲` / `⿳` のarity・role・relative geometry、parser/layout/DOM回帰テスト
- Phase 8 Packaging: `renderIds`公開API、ESM/browser bundle、型宣言、CSS asset、package exports、consumer demo
- Phase 8.5 Validation: nested absolute scale回帰、Phase 6 browser visual record、CHISE live/CORS preflight、response fixture分類
- Phase 9 Hardening: `observeIds` MutationObserver、contenteditable default-off/opt-in、TTL/max/clear memory cache、a11y metadata、IDS copy fallback、vertical writing investigation、performance profile tests
- Phase 9.1 Release Audit: CHISE query-only variant normalization、unique IDSのbounded parallel resolve、normalized query単位のin-flight dedupe、実ブラウザ単一glyph copy確認、Supported IDC/LICENSE/CI gate整備
- Phase 9.2 Internal Refactor: Layout→DOM、Text Node document rendering、copy/a11y、batch resolve、MutationObserverを責務別moduleへ分離。公開API・既存内部adapterの挙動は維持し、不要な`dom-renderer.ts` compatibility barrelを削除
- Phase 9.2 Optimization Pass: providerなしの`renderIds`/`observeIds`は同期local composition経路を使用。MutationObserverは同一callback内の追加を親要素へ集約し、containment dedup後にrenderする。公開API・CHISE有効時のasync batch semanticsは維持
- Mobile GitHub Pages: `examples/index.html`のスマホ確認入口、IDS入力・候補select・local/CHISE切替・パターン一覧、Pages専用multi-page build、main push deploy workflowを追加。入口URLは`https://kinoko34077.github.io/IDS-Composit/`
- v0.2 Documentation: 新要件を`docs/v0.2/`の章別文書へ分割し、`docs/v0.2/00_INDEX.md`を参照入口とした。原資料は`docs/v0.2/source/`に保存。
- v0.2 Compatibility: `tests/compat/v0-1-runtime.test.ts`で公開API、fallback、contenteditable、provider障害、observer停止、copy/a11y metadataの基準を固定。
- v0.2 Known Character Index: NFC lookup key、出典付きverified/candidate、many-to-many lookup、ambiguity handlingを実装。初期手動seed `⿲彳圭亍 → 街`は外部確認待ちのcandidateとして保持し、native/Calibrationから除外。external source artifactの決定的generatorも追加。
- v0.2 Resolver Chain: explicit provider → verified Known Index → CHISE → structural Parser/Coverage → local composition → source fallbackの順序を実装。local未対応IDCでもnative問い合わせへ到達し、既存`resolveIds(ids, provider?)`を維持しながら任意のKnown Index引数を追加。
- v0.2 Resolver/Index hardening: scannerは閉じたunsupported IDCをnative問い合わせ可能なIDS segmentとして保持。explicit provider miss後のCHISE fallback、Known IndexのNFC lookup、原文provenance保持、external source generator、manual candidate policyを回帰テスト付きで固定。
- v0.2 Structural Coverage: 14 spatial IDCのarity/role/layout/DOM処理をデータ駆動で追加。`⿾`/`⿿`は未対応のまま。
- v0.2 Calibration Foundation: ink metrics、corpus split、loss report、純粋slot optimizer、IDC/role別Generic Layout Profile集約、profile適用の型・テスト・空データartifactを追加。production runtimeへCanvas/SVGは導入していない。
- Mobile Pages v0.2 surface: 14 spatial IDC、Known candidate/nativeの区別、local composition、未対応IDCのsource-preserving fallbackを入力・候補・一覧で試せる状態へ更新。

## 運用観測 / 次作業

v0.2 first-slice commit `7f62c6e` のGitHub Actions CI Run #25とPages Run #3がcompleted successfullyであることを確認済み。v0.1.0 Releaseは[GitHub Release](https://github.com/kinoko34077/IDS-Composit/releases/tag/v0.1.0)で公開済み。今回のhardening差分は、全31 test files / 179 tests、runtime/tools typecheck、library/Pages build、package dry-runを通過している。次は外部provenance付きKnown mappingを投入できるsource取得・生成運用を整え、実データが揃ってからcalibration用raster測定へ進む。

## 残課題 / manual validation

- 縦書きでの構図保証と、固定比率の適否
- 複数fontにおける高密度glyphの判読性
- CHISE timeout/cache値の本番調整
- 初期font-family
- baseline補正値
- npm registry/CDNへの公開手順
- optional persistent cacheの必要性と仕様
- v0.2 calibration corpusの取得、Canvas/SVGによるtools限定raster測定、文字単位optimization、profile生成、holdout gate
- v0.2 resolver pathの実測表示とCHISE live環境での再確認

## 重要な再検討条件

以下が確認された場合のみ上位設計を再検討する。

- CHISE APIでは必要な文字同定が実用上困難
- CHISE利用条件が配布形態と衝突
- DOM/CSS合成が大半の対象で判読不能
- CHISEの現行IDS表現とParser方針が重大に衝突
