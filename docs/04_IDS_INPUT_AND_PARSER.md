# IDS Input & Parser Specification

## 1. 埋込構文

初期構文：

```text
⟦<IDS>⟧
```

例：

```text
これは⟦⿰木可⟧です。
```

`⟦` `⟧` は本ライブラリのdelimiterであり、Unicode IDS仕様自体ではない。

## 2. Scanner

Scannerは本文Text Nodeからdelimiterを検出し、通常本文とIDS sourceへ分割する。

禁止：

- `script`
- `style`
- `textarea`

等の内容を無差別に変換しない。

`contenteditable`、Shadow DOM、MutationObserverは後段仕様。

## 3. Parser責務

Parserは、

```text
IDS source → AST
```

のみ行う。

CHISE問い合わせ、variant変換、layout、DOM生成を行わない。

## 4. 再帰構造

```text
⿰木⿱日月
```

を、

```text
        ⿰
       /  \
      木    ⿱
           / \
          日 月
```

として保持する。

## 5. IDC arity

IDCごとのarityはdata tableとして持つ。

Phase 0で必要な最小対応：

```text
⿰ 2
⿱ 2
⿴ 2
```

その後、標準IDS/CHISEで必要なIDCをtable追加で拡張する。

## 6. Grapheme

leafは単純なUTF-16 code unitではなく、少なくともUnicode scalar / grapheme境界を壊さない実装を選ぶ。

IVS等の詳細対応は別仕様とし、Phase 0で独自分解しない。

## 7. Parse Error

不正入力：

- 子不足
- 余剰token
- 未対応operator
- 空IDS
- delimiter不整合

Parserは周辺本文を変更せず、元sourceをfallback表示可能なエラー結果を返す。
