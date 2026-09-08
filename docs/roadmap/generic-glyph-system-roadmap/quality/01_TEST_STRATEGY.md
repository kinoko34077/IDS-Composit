# Test Strategy

## Unit
- Parser
- Role Resolver
- Variant Resolver
- Layout Engine
- Unicode/Generic Resolver
- Registry

## Snapshot
`IDS → expected Layout Model`
構造計算をCSS変更から隔離。

## Integration
`本文 → Scanner → Parser → Composition → DOM`

## Visual Regression
Stage 5以降、固定テストコーパスを同条件で描画し比較。

## 原則
構文・解決・レイアウト・描画の失敗を同一テストで曖昧にしない。
