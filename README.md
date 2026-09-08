# IDS-Composit

IDS型の構造記述を用いて、既存Unicode文字部品をWeb上で一文字相当に合成表示するためのプロトタイプです。

## 位置付け

このプロジェクトは、Unicodeを置き換えるものではありません。Unicodeで通常表示できる文字は既存のフォント・フォールバックを優先し、Unicode外または明示的に指定された字形を補完する構成層を目指します。

現在の初期プロトタイプでは、次の流れを検証対象とします。

```text
本文 + ⟦IDS式⟧
  → Scanner
  → IDS Parser / AST
  → Structural Role Resolver
  → Position Variant Resolver
  → Composition / Layout Model
  → HTML/CSS Inline Display Adapter
```

## 要件定義

- [Generic Glyph System／IDS文字合成機構 要件定義書 v0.1](docs/requirements/generic-glyph-system-requirements-v0.1.md)：Registry、Resolver、Composition、Renderer等を含む長期構想
- [IDS型文字部品合成表示機構 要件定義書 v0.1](docs/requirements/ids-composition-display-requirements-v0.1.md)：RegistryやSVGを導入しない初期プロトタイプの具体仕様
- [Generic Glyph System / IDS文字合成機構 ロードマップ](docs/roadmap/generic-glyph-system-roadmap/00_INDEX.md)：Stage 0〜14の実装順序、設計境界、品質ゲート

初期実装は後者の範囲に限定し、SVG、Canvas、KAGE、Glyph Registry、OpenType生成、高度な組版は対象外とします。

## 開発状況

現在はリポジトリと要件文書の初期セットアップ段階です。実装開始前の設計・受入条件の確認を行います。

## License

ライセンスは未決定です。
