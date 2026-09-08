# Generic Glyph System / IDS文字合成機構 — INDEX

## 目的
Unicode外Glyphを補完するGeneric Glyph Systemと、その最小実証であるIDS DOM/CSS合成器の開発資料。

## 最短読取順
1. `01_PROJECT_SCOPE.md`
2. `02_ARCHITECTURE_SUMMARY.md`
3. 現在Stageの `stages/stageXX/README.md`
4. 必要な枝葉だけ読む

## 現在の実装対象
**Stage 0〜5：Phase 0 — IDS DOM Composition Prototype**

```text
⟦IDS⟧
→ Parser
→ AST
→ Role Resolver
→ Variant Resolver
→ Layout Template
→ Composition Engine
→ Layout Model
→ DOM/CSS Inline Display
→ 実字形評価
```

## 非対象（Phase 0）
Registry / SVG / Canvas / KAGE / Font生成 / API / 認証 / 高度字形生成

## 全Stage
|Stage|内容|入口|
|---:|---|---|
|0|仕様固定・開発土台|`stages/stage00/README.md`|
|1|IDS Parser|`stages/stage01/README.md`|
|2|Role / Layout / Composition Core|`stages/stage02/README.md`|
|3|DOM/CSS Inline Display|`stages/stage03/README.md`|
|4|Position Variant Resolver|`stages/stage04/README.md`|
|5|Prototype評価・Decision Gate|`stages/stage05/README.md`|
|6|Composition Engine v0.2|`stages/stage06/README.md`|
|7|Unicode Resolver|`stages/stage07/README.md`|
|8|Generic Glyph Resolver|`stages/stage08/README.md`|
|9|Generic Glyph Registry MVP|`stages/stage09/README.md`|
|10|SVG Renderer|`stages/stage10/README.md`|
|11|その他Renderer|`stages/stage11/README.md`|
|12|Advanced Glyph Generation|`stages/stage12/README.md`|
|13|Registry高度化|`stages/stage13/README.md`|
|14|Generic Glyph System統合|`stages/stage14/README.md`|

## 横断資料
- 責務境界: `architecture/01_RESPONSIBILITY_BOUNDARIES.md`
- データモデル: `architecture/02_DATA_MODELS.md`
- 依存方向: `architecture/03_DEPENDENCY_RULES.md`
- 解決フロー: `architecture/04_RESOLUTION_FLOW.md`
- 非対象: `architecture/05_NON_GOALS.md`
- テスト方針: `quality/01_TEST_STRATEGY.md`
- Gate一覧: `quality/02_STAGE_GATES.md`
- 未確定事項: `quality/03_OPEN_DECISIONS.md`
- Codex投入法: `ops/01_CODEX_USAGE.md`

## 不変原則
1. Unicodeを不要に再発明しない。
2. Registry / Composition / Rendererを分離。
3. IDSをRegistryの正本にしない。
4. SVGを正本形式にしない。
5. 保存表現と表示表現を分離。
6. Phase 0は既存文字を強引に配置するだけ。
7. 位置別variantは `base + role → variant`。
8. 配置比率は当面IDC単位で一律。
9. 上位構想を理由に先回り実装しない。
