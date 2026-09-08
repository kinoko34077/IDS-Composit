# Stage 3 / DOM Adapter

基本:
```html
<span class="composed-glyph">
  <span class="glyph-part">...</span>
</span>
```

親:
- inline-block
- position: relative
- width: 1em
- height: 1em

子:
- position: absolute
- Layout Modelの座標をCSSへ変換
