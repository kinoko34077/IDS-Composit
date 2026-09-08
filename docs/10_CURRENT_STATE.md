# Current State

Updated: 2026-09-08

## 現在段階

**仕様再定義完了 / 実装開始前**

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

## 次作業

`agent/PHASE_00_FOUNDATION.md`

## 未確定

- repository/package名
- build tool
- exact public API
- CHISE timeout/cache値
- 初期font-family
- baseline補正値
- Phase 0以降に追加するIDC
- copy/accessibilityの詳細

## 重要な再検討条件

以下が確認された場合のみ上位設計を再検討する。

- CHISE APIでは必要な文字同定が実用上困難
- CHISE利用条件が配布形態と衝突
- DOM/CSS合成が大半の対象で判読不能
- CHISEの現行IDS表現とParser方針が重大に衝突
