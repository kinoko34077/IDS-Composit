# Documentation Index

## 正本

|文書|役割|読む時|
|---|---|---|
|`01_REQUIREMENTS.md`|要求・完成条件・非対象|仕様確認・変更時|
|`02_ARCHITECTURE.md`|責務境界・依存方向|構造変更時|
|`03_CHISE_DEPENDENCY.md`|CHISEとの境界・API利用方針|外部連携変更時|
|`04_IDS_INPUT_AND_PARSER.md`|入力記法・AST・Parser|Parser変更時|
|`05_COMPOSITION_LAYOUT.md`|Role・Variant・Layout Model|合成ロジック変更時|
|`06_DOM_RENDERING.md`|Web inline表示|DOM/CSS変更時|
|`07_VARIANT_POLICY.md`|位置別部品variant|variant追加時|
|`08_TEST_AND_ACCEPTANCE.md`|テスト・受入条件|実装/レビュー時|
|`09_ROADMAP.md`|実装順序・Gate|計画時|
|`11_ADR.md`|主要設計判断と不採用案|設計再検討時|
|`12_TRACEABILITY.md`|要件→実装→テスト追跡|レビュー時|

## Current State

`10_CURRENT_STATE.md` は現在進捗・次作業専用。恒久仕様ではない。

## Validation records

- `validation/PHASE_06_VISUAL_VALIDATION.md`: Phase 6 corpusのbrowser目視・CHISE CORS preflight
- `validation/PHASE_09_HARDENING.md`: Phase 8.5 GateとPhase 9 hardening記録

## Agent Phase Docs

`agent/PHASE_*.md` はエージェントへその段階だけ渡すための作業指示。上位正本を複製せず、必要な参照先とGateだけを保持する。

## 読み順

### 新規エージェント

```text
AGENTS.md
↓
00_INDEX.md
↓
10_CURRENT_STATE.md
↓
対象 PHASE doc
↓
必要な正本だけ読む
```

### 仕様変更

```text
01_REQUIREMENTS
↓
関連個別仕様
↓
11_ADR
↓
09_ROADMAP / 10_CURRENT_STATE
```
