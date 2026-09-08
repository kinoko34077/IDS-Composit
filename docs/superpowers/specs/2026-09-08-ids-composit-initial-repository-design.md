# IDS-Composit 初期リポジトリ設計

日付: 2026-09-08

## 目的

IDS-Composit の長期構想と初期プロトタイプ仕様を、実装前に追跡可能な形でリポジトリへ登録する。

## 方針

Generic Glyph System 要件定義書を長期アーキテクチャの基準とし、IDS型文字部品合成表示機構 要件定義書を最初に検証する実装範囲の基準とする。

初期プロトタイプは、本文中の `⟦IDS式⟧` を解析し、AST、構造役割、位置別variant、描画方式非依存のLayout Modelを経て、HTML/CSSへ投影する。Composition EngineはRegistryや特定Rendererに依存させない。

## 初期対象外

SVG、Canvas、KAGE、筆画生成、Glyph Registry、永続字形DB、OpenType生成、ブラウザshaping engine統合、高度な光学補正は初期プロトタイプへ含めない。

## 初期受入の軸

要件書に定義された AC-001〜AC-012 を実装時の受入基準とする。特に、囲み外の本文保持、単純・入れ子IDSの解析、位置別variant、variant未定義時の継続、固定Layout Template、再帰DOM表示を確認する。

## リポジトリ構成

```text
README.md
.gitignore
docs/
  requirements/
    generic-glyph-system-requirements-v0.1.md
    ids-composition-display-requirements-v0.1.md
  superpowers/specs/
    2026-09-08-ids-composit-initial-repository-design.md
```

この段階ではアプリケーション実装、依存関係、ビルド設定は追加しない。
