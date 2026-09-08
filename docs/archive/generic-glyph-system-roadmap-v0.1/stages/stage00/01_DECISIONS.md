# Stage 0 / Decisions

## 固定
- 入力: `⟦IDS⟧`
- P0 IDC: `⿰`, `⿱`, `⿴`
- Layout座標: 0〜1相対値
- 初期描画: DOM + CSS
- 部品: 既存Unicode文字
- Variant: `base + role → variant`
- 未定義variant: base文字を使用
- Layout比率: IDCごと一律

## 暫定初期値
- `⿰`: 50:50
- `⿱`: 50:50
- `⿴`: outer 100%, inner中央60%

初期値は仕様の不変値ではなくデータ。
