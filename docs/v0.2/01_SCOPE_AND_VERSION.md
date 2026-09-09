# v0.2 Scope and Version

## Baseline

`v0.1.0`はcommit `25e0449`を正本とする。公開API、fallback、DOM integration、Observer、copy/accessibilityをv0.2の互換基準として保持する。

## v0.2の追加能力

1. 空間配置IDCの対応範囲を広げる。
2. 出典付きIDS↔既存Unicode文字のKnown Character Indexを持つ。
3. 既知字を教師にしてGeneric Layout Profileを導出する。

既知字はnative Unicodeを優先し、個別calibration結果は未知字の配置相場を学ぶためのevidenceとして扱う。

## 継続する非目標

独自Character ontology、Generic Glyph Registry、CHISE複製DB、独自CID、PUA、IME、font生成、OS shaping改造、runtime SVG、runtime Canvasは作らない。

Canvas/SVGは`tools/calibration/`内の測定用途だけ許可する。
