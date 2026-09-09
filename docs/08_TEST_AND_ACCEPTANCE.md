# Test & Acceptance Specification

## v0.2 gates

v0.2では既存ACに加え、14 spatial IDC、Known Indexのprovenance/many-to-many/ambiguity、resolver chain、Calibrationのtrain/holdout分離、Generic Profileのmedian/p75比較を確認する。v0.1公開APIとfallbackの回帰は`tests/compat/`で固定する。章別の受入条件は [docs/v0.2/10_GATES_AND_NON_GOALS.md](v0.2/10_GATES_AND_NON_GOALS.md) に集約する。

## 1. テスト層

### Unit

- Scanner
- Parser
- Role Resolver
- Variant Resolver
- Layout Engine
- CHISE response normalization

### Integration

- Scanner → native-first Resolver → Parser/Coverage → Composition
- CHISE Adapter fixture test
- DOM Adapter browser test

### External Integration

- live CHISE API smoke test
- CIでは外部障害と内部failureを区別

### Visual

固定sample pageをbrowserで確認する。

---

## 2. Acceptance Criteria

### AC-001
`AAA⟦⿰木可⟧BBB`からIDS区間だけを検出し、AAA/BBBを保持する。

### AC-002
`⿰木可`を正しい二項ASTへ変換できる。

### AC-003
`⿰木⿱日月`を再帰ASTへ変換できる。

### AC-004
不正IDSで周辺本文を破壊しない。

### AC-005
CHISE Adapterが`ids-match`問い合わせをCoreから隔離する。

### AC-006
CHISEでnative文字へ解決できた場合、Compositionせずnative textを返せる。

### AC-007
CHISE no-match時にCompositionへfallbackする。

### AC-008
CHISE unavailable時にもCompositionへfallbackできる。

### AC-009
`⿰`のchildrenへleft/right roleを割り当てられる。

### AC-010
`⿱`のchildrenへtop/bottom roleを割り当てられる。

### AC-011
`⿴`のchildrenへouter/inner roleを割り当てられる。

### AC-012
`水 + left → 氵`等のVariant Mapを適用できる。

### AC-013
variant未登録部品は基底文字をそのまま利用できる。

### AC-014
Layout ModelがDOM固有値を持たず、0〜1相対boxで表せる。

### AC-015
未解決IDSを1em相当のDOM boxへ表示できる。

### AC-016
ネストCompositionを再帰DOMとして表示できる。

---

## 3. Visual Validation Set

最低限：

```text
⟦⿰木可⟧
⟦⿰水青⟧
⟦⿱艹明⟧
⟦⿴囗王⟧
⟦⿰木⿱日月⟧
```

さらに高画数・左右密度差・上下密度差を追加し、単純layoutの限界を記録する。

---

## 4. Phase 0成功判定

成功条件：

- 構造が読める
- 部品が判別できる
- 本文中で概ね一文字に見える
- 主要fontで致命的に崩れない
- CHISE障害が本文全体へ波及しない

美術的品質はPhase 0合格条件にしない。
