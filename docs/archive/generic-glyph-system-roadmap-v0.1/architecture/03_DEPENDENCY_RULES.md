# Dependency Rules

## 許容
```text
parser
  ↓
composer core
  ↓
layout model
  ↓
dom adapter

resolver
  ├→ unicode resolver
  ├→ registry client
  └→ composer

svg renderer
  → glyph/layout model
```

## 禁止
```text
parser → DOM
parser → Registry
composer → Registry
composer → SVG
registry → IDS必須
svg renderer → DOM adapter
```

## 理由
変更理由が異なるものを分離し、Phase 0の実装を将来構想で汚染しないため。

## Package化候補
```text
@glyph-system/ids-parser
@glyph-system/han-composer
@glyph-system/dom-adapter

将来:
@glyph-system/resolver
@glyph-system/registry-client
@glyph-system/svg-renderer
```
