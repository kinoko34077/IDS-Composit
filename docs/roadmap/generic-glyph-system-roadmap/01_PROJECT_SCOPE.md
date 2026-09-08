# Project Scope

## 上位目的
Unicode・Font体系を維持しつつ、その外側に存在する任意Glyphを独立した識別・解決・構成・描画レイヤーで通常文字列へ接続する。

## 現在の第一実証
IDS型構造と既存Unicode文字を使い、DOM/CSS上で複数文字を縮小・移動・重ね合わせて疑似一文字として表示する。

## 本体と下位機構
```text
Generic Glyph System
└─ Han Composition Engine
   └─ IDS Parser / Composer
```

IDSはGlyph Systemそのものではなく、漢字構成入力方式の一つ。

## Unicodeとの関係
```text
Unicodeで表現可能
→ native Unicode + 通常font fallback

Unicodeで表現不能
または明示的独自Glyph参照
→ Generic Glyph Layer
```

## Encoding
UTF-8 / UTF-16 / Shift_JIS等は入出力encoding。
Glyph識別・内部処理の本質とは分離する。

## Phase 0の目的
「既存完成文字を固定レイアウトへ押し込むだけで、どこまで判読可能か」を測定する。

## Phase 0で作らない
Registry / SVG Renderer / Canvas / KAGE / Font / server API / account / moderation。
