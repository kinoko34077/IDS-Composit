# IDS-Composit v0.2 仕様一式

このZIPは、現行 v0.1 を互換基準APIとして固定し、v0.2 で以下3責務を追加するための仕様・実装指示一式です。

## 同梱物

1. `01_IDS-Composit_v0.2_要件・アーキテクチャ仕様書.md`
   - v0.1 / v0.2 の位置づけ
   - 4責務構造
   - Structural Coverage
   - Known Character Index
   - Layout Calibration / Generic Layout Profile
   - Runtime依存境界
   - v0.2完成条件

2. `02_Codex実装指示書_IDS-Composit_v0.1_to_v0.2.md`
   - v0.1基準点固定
   - Compatibility Gate
   - AGENTS / docs更新
   - Known Character Index
   - Resolver Chain
   - Spatial IDC Coverage
   - Calibration Corpus / Measurement / Optimization
   - Pages比較UI
   - Holdout Validation
   - 実装順・禁止事項・Done Definition

## 基準

- v0.1完成基準: commit `25e0449`
- v0.2の4責務:
  - A. Runtime / Render API
  - B. Structural Coverage
  - C. Known Character Index
  - D. Layout Calibration / Profiles

## 重要方針

位置調整は以下の順で行う。

1. IDS↔実在Unicode文字の対応付けを確立
2. 既存字だけを教師として、各字の合成結果とnative glyphを比較
3. 各字ごとの最適配置を求める
4. 個別配置群からIDC/Roleごとの一般的な配置相場を統計的に導出
5. 未符号・未知字へGeneric Layout Profileとして適用

Canvas / SVG は開発・Calibration用途に限定し、production runtime rendererはDOM/CSSを維持する。
