# Phase 06 — Visual Validation Record

日付: 2026-09-09

## 目的

Phase 0〜5の固定比率DOM/CSS合成が、本文中で構造と主要部品を判読できるかを確認する。観測前に個別glyphの光学補正は追加しない。

## 実行方法

1. `npm run dev -- --host 127.0.0.1` を起動する。
2. `/validation.html` を開く。
3. System UI、serif、sans-serif、monospaceを切り替える。
4. 各行について、構造、部品、1文字相当の領域、baseline、本文との間隔を確認する。
5. 問題を以下の分類へ記録する。

|分類|観測対象|
|---|---|
|fixed ratio|左右・上下・囲みの固定比率が判読性を損なうか|
|variant|位置variant不足または基底文字fallbackが目立つか|
|font dependency|font変更で部品の大きさ・字形が崩れるか|
|DOM baseline|inline boxのbaseline・overflow・本文行高に問題があるか|
|compression limit|高画数部品や密度差で単純縮小の限界が出るか|
|parser/structure|構造またはnested DOMが誤っているか|

## 固定corpus

|Case|IDS|狙い|
|---|---|---|
|binary|`⟦⿰木可⟧`|左右固定比率|
|variant|`⟦⿰水青⟧`|`水 + left → 氵`|
|vertical|`⟦⿱艹明⟧`|上下固定比率|
|surround|`⟦⿴囗王⟧`|outer/inner|
|nested|`⟦⿰木⿱日月⟧`|再帰構造|
|trinary-horizontal|`⟦⿲彳圭亍⟧`|三項左右構造|
|trinary-vertical|`⟦⿳士冖豆⟧`|三項上下構造|
|dense-horizontal|`⟦⿰鬱青⟧`|左右密度差|
|dense-vertical|`⟦⿱龜心⟧`|上下密度差|

## 現時点の記録

- Parser、role、relative box、variant、nested DOMは自動テストで確認済み。
- rootは1em inline box、子glyphは親boxに対する相対scaleを使う。
- 固定比率を維持し、観測前の個別補正は追加していない。
- 複数fontでの目視判定とスクリーンショット採取は、ブラウザ実行環境で行うmanual validationとして残す。
- 三項IDC `⿲` / `⿳` はPhase 7でcorpusへ追加済み。
