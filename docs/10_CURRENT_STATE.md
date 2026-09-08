# Current State

Updated: 2026-09-09

## 現在段階

**Phase 8 package artifact 実装済み / Phase 9 hardeningへ**

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
- Phase 4.5 Correctness: glyph本体の相対scale、Role/geometry分離、局所renderer fallback、README/Traceability同期、最小CI
- Phase 5 CHISE Adapter / Resolver: `ids-match` response normalization、injected fetch、timeout/HTTP/JSON failure、TTL memory cache、native優先、local composition fallback、unavailable diagnostic
- Phase 6 Visual Validation: 固定corpus、複数font切替sample、failure classification記録（目視判定はmanual）
- Phase 7 IDS Coverage: Unicode trinary IDC `⿲` / `⿳` のarity・role・relative geometry、parser/layout/DOM回帰テスト
- Phase 8 Packaging: `renderIds`公開API、ESM/browser bundle、型宣言、CSS asset、package exports、consumer demo

## 次作業

Phase 9 hardening（MutationObserver、contenteditable、cache persistence、accessibility/copy、performance）

## 残課題 / manual validation

- 複数fontでの目視判定とスクリーンショット採取
- CHISE live smokeの実行環境とCORS条件
- CHISE timeout/cache値の本番調整
- 初期font-family
- baseline補正値
- npm registry/CDNへの公開手順
- Phase 9で扱うcopy/accessibilityの詳細

## 重要な再検討条件

以下が確認された場合のみ上位設計を再検討する。

- CHISE APIでは必要な文字同定が実用上困難
- CHISE利用条件が配布形態と衝突
- DOM/CSS合成が大半の対象で判読不能
- CHISEの現行IDS表現とParser方針が重大に衝突
