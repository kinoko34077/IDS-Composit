# IDS-Composit v0.2 Documentation Index

v0.2の正本文書入口。実装時は必要な章だけを読み、原文全体は`source/`で確認する。

## 読み方

|目的|読む文書|
|---|---|
|v0.1との関係・対象範囲|[01_SCOPE_AND_VERSION.md](01_SCOPE_AND_VERSION.md)|
|4責務・依存方向|[02_RESPONSIBILITIES.md](02_RESPONSIBILITIES.md)|
|v0.1互換条件|[03_RUNTIME_COMPATIBILITY.md](03_RUNTIME_COMPATIBILITY.md)|
|追加IDC・構造処理|[04_STRUCTURAL_COVERAGE.md](04_STRUCTURAL_COVERAGE.md)|
|IDS↔Unicode補完Index|[05_KNOWN_CHARACTER_INDEX.md](05_KNOWN_CHARACTER_INDEX.md)|
|resolver順序|[06_RESOLUTION_CHAIN.md](06_RESOLUTION_CHAIN.md)|
|教師データ・測定・最適化|[07_CALIBRATION.md](07_CALIBRATION.md)|
|runtime profile適用|[08_RUNTIME_PROFILES.md](08_RUNTIME_PROFILES.md)|
|Pages確認面・holdout|[09_PAGES_AND_VALIDATION.md](09_PAGES_AND_VALIDATION.md)|
|Gate・非目標|[10_GATES_AND_NON_GOALS.md](10_GATES_AND_NON_GOALS.md)|
|実装順|[11_IMPLEMENTATION_ORDER.md](11_IMPLEMENTATION_ORDER.md)|
|Known Character Multi-Source統合|[12_MULTI_SOURCE_KNOWN.md](12_MULTI_SOURCE_KNOWN.md)|
|Calibration実測基盤（C0〜C17）|[13_CALIBRATION_MEASUREMENT.md](13_CALIBRATION_MEASUREMENT.md)|

## 原文・実装指示

- [要件・アーキテクチャ原文](source/01_IDS-Composit_v0.2_要件・アーキテクチャ仕様書.md)
- [Codex実装指示原文](source/02_Codex実装指示書_IDS-Composit_v0.1_to_v0.2.md)
- [資料README](source/00_README.md)

## v0.2の責務

```text
A Runtime / Render API
B Structural Coverage
C Known Character Index
D Layout Calibration / Profiles
```

薄いOrchestrator以外で責務を混在させない。runtimeはDOM/CSSを維持し、Calibration用Canvas/SVGをproduction bundleへ入れない。
