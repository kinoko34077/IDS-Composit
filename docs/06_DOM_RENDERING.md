# DOM Inline Rendering Specification

## 1. 目的

Layout ModelをWeb本文中の一文字相当領域へ投影する。

## 2. 基本DOM

```html
<span class="ids-inline-glyph" data-ids="⿰水青">
  <span class="ids-part">氵</span>
  <span class="ids-part">青</span>
</span>
```

実際のclass名は実装時に確定してよい。

## 3. 親box

初期基準：

```css
display: inline-block;
position: relative;
width: 1em;
height: 1em;
```

baseline補正値はvisual testで決定する。

## 4. 子部品

Layout Modelから、

- left/top
- width/height
- scale
- transform-origin

等へ変換する。

既存font glyphをその場で使う。

Layout Modelのboxはroot基準の0〜1絶対座標であるため、DOM Adapterのglyph contentは親boxとの比率ではなく、glyph boxの絶対 `width` / `height` をscaleへ使う。これによりnested compositionでも親の縮小分を失わない。

## 5. Native解決

CHISE Resolverがnative textを返した場合はComposition DOMを作らず、通常Unicode文字を挿入する。

## 6. Metadata

合成boxは最低限元IDSを保持する。

```html
data-ids="..."
```

合成boxは `role="img"` と元IDSの `aria-label` を持ち、内部部品は `aria-hidden="true"` とする。native解決時は通常textを挿入し、合成DOMの内部部品を読み上げさせない。copy eventでは `⟦IDS⟧` をtext/plainへ優先する。

## 7. Failure

DOM生成に失敗した場合、元 `⟦IDS⟧` を表示して意味情報を失わない。

## 8. Phase 0非対象

- SVG
- Canvas
- WebGL
- Shadow DOM必須化
- 完全cursor integration
- 完全copy rewrite
- native text selection同等性
- 縦書き完全対応
