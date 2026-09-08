# Requirements Specification
## CHISE IDS Inline Renderer v0.1

## 1. 目的

CHISEを文字情報基盤として利用し、通常Web本文中へ埋め込まれたIDS表現を認識し、

1. CHISEで既存文字へ解決できる場合はnative Unicode文字として表示し、
2. 解決できない場合は既存Unicode文字・部品を簡易配置して、
3. 一文字相当のinline表示として判読可能にする。

本ライブラリは文字情報基盤を新規構築しない。

---

## 2. 上位要求

### REQ-001 CHISE依存
文字同定、既存文字との対応、漢字構造情報の正本はCHISEに依存する。本プロジェクトは独自の包括的文字DBを作らない。

### REQ-002 IDS入力
通常本文中へ `⟦IDS⟧` 形式で合成対象を埋め込める。

例：

```text
これは⟦⿰水青⟧という字です。
```

### REQ-003 Native優先
CHISEがIDSを既存文字へ解決できた場合、合成表示よりnative Unicode表示を優先する。

### REQ-004 Composition fallback
CHISEで既存文字へ解決できない場合、IDS構造に基づき既存Unicode部品を簡易合成する。

### REQ-005 DOM/CSS renderer
初期版はSVGを生成せず、HTML DOM/CSSによる縮小・移動・配置・重ね合わせで表示する。

### REQ-006 一文字相当
合成結果は通常本文中で概ね1em相当の一文字領域として表示できる。

### REQ-007 ネスト
IDSの再帰構造を保持し、ネストした構成を再帰的に合成できる。

### REQ-008 位置別variant
意味上の基底部品と構造上の役割から、既存Unicodeの位置別部品形を選択できる。

例：

```text
水 + left   → 氵
水 + bottom → 氺
火 + bottom → 灬
手 + left   → 扌
心 + left   → 忄
人 + left   → 亻
```

### REQ-009 variant fallback
位置別variantが未登録の場合、基底文字をそのまま合成に使用する。

### REQ-010 固定Layout
初期版の配置比率はIDC/構図単位で一律とし、字ごとの高度な最適化を行わない。

### REQ-011 Data-driven
IDCの役割、Layout Template、位置別variantは原則データとして差し替え可能にする。

### REQ-012 描画非依存Core
Parser・Role Resolver・Variant Resolver・Layout EngineはDOM/CSS固有情報へ依存しない。

### REQ-013 CHISE障害時継続
CHISE APIが一時利用不能でも、IDS自体をparse可能な場合はlocal compositionを試み、本文全体を失敗させない。

### REQ-014 原文保持
失敗時に元 `⟦IDS⟧` 表現を失わない。Scanner/Renderer失敗によって周辺本文を破壊しない。

### REQ-015 軽量導入
最終的に一般Webサイトから少数の導入手順で利用できるライブラリ境界を持つ。

---

## 3. 明示的非対象

以下はv0.1要件に含めない。

- 独自Glyph Registry
- 独自Character DB
- CHISE互換DB
- 新しい文字コード
- CID/Character ID体系
- SVG生成
- SVG字形保存
- Canvas
- KAGE/GlyphWiki生成
- stroke編集
- OpenType/WebFont生成
- PUA割当
- IME
- OS/ブラウザfont fallback統合
- shaping engine統合
- 完全なDTP品質
- Unicodeに存在しない字の意味的canonicalization
- 誰でもglyphを登録する公共DB

---

## 4. 品質目標

本版の表示品質目標は「正字形の完全再現」ではなく、

> IDSの構成と主要部品が判読でき、普通の本文中で一文字として概ね扱えること。

である。

---

## 5. 外部依存境界

CHISEは外部世界の現行システムであるため、APIパス・レスポンス形式・利用条件をコード内の推測で固定しない。

CHISE連携はAdapterへ隔離する。

---

## 6. 完成条件

v0.1は `08_TEST_AND_ACCEPTANCE.md` のAC-001〜AC-016を満たした場合に完成とする。
