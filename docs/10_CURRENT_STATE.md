# Current State

Updated: 2026-09-09

## 現在段階

**Phase 9.2 targeted optimization 実装済み / v0.1 RC2確認済み**

## 最新確定方針

- 文字情報基盤はCHISEへ依存する。
- IDSを入力表現として利用する。
- 独自Registryを作らない。
- 本プロジェクトは簡易Web rendering/composition layerへ限定する。
- CHISEで既存文字へ解決できればnative Unicode優先。
- 未解決なら既存Unicode部品をDOM/CSSで強引に配置する。
- `水→氵`等の位置variantを表示時に適用する。
- 構図ごとの比率は当面一律。
- SVG/KAGE/Canvas/font生成は対象外。

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

## 運用観測 / 次作業

実装commit `6c016ab` のGitHub Actions CI Run #17、およびCI maintenance commit `f2e8f9b` のRun #19がgreenであることを確認済み。Run #19ではNode 20 deprecation warningも解消した。スマートフォン確認面はPages workflowの初回deploy後にdogfoodingへ進み、追加課題は実利用で再現した箇所だけ小さく改善する。

## 残課題 / manual validation

- 縦書きでの構図保証と、固定比率の適否
- 複数fontにおける高密度glyphの判読性
- CHISE timeout/cache値の本番調整
- 初期font-family
- baseline補正値
- npm registry/CDNへの公開手順
- optional persistent cacheの必要性と仕様

## 重要な再検討条件

以下が確認された場合のみ上位設計を再検討する。

- CHISE APIでは必要な文字同定が実用上困難
- CHISE利用条件が配布形態と衝突
- DOM/CSS合成が大半の対象で判読不能
- CHISEの現行IDS表現とParser方針が重大に衝突
