# Phase 06 — Visual Validation Record

日付: 2026-09-09（browser実測追記）

## 目的

Phase 0〜5の固定比率DOM/CSS合成が、本文中で構造と主要部品を判読できるかを確認する。観測前に個別glyphの光学補正は追加しない。

## 実行方法

1. `npm run dev` を起動する（Viteの既定ポートを使用）。
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
- rootは1em inline box、子glyphはLayout Modelのroot基準絶対box寸法でscaleする。
- 固定比率を維持し、観測前の個別補正は追加していない。
- 三項IDC `⿲` / `⿳` はPhase 7でcorpusへ追加済み。

## Browser実測結果

Vite validation pageをブラウザで開き、System UI、serif、sans-serif、monospaceを切り替えて全corpusを確認した。

|観測|結果|分類|判定|
|---|---|---|---|
|binary / nested / `⿲` / `⿳`|部品順と構造が読める|parser / structure|問題なし|
|`⿰水青`|左部品が `氵` として表示される|variant|seed variantの範囲で問題なし|
|serif / sans-serif / monospace / system|字体差はあるが固定boxは維持|font dependency|許容、初期fontは未固定|
|baseline / 本文との間隔|行内に収まり、本文を破壊しない|DOM baseline|致命的問題なし、補正値は継続観測|
|1em / overflow|各sampleが一文字相当box内に収まる|fixed ratio|問題なし|
|dense `鬱` / `龜`|高密度部品で線が接近し判読性が低下|compression limit|単純縮小の限界として記録|
|固定の左右・上下・囲み比率|構造は判別可能|fixed ratio|現行v0.1を継続|

この時点では個別glyphの光学補正を追加しない。高密度部品の改善は、固定比率方式の限界として別途仕様判断する。

## Phase 8.5 CHISE live / CORS preflight

`/chise-preflight.html` を同じブラウザで実行した（2026-09-09 JST）。

|Probe|HTTP / fetch type|Body|観測|
|---|---|---|---|
|`⿰氵⿱木日`|`200 cors`|Unicode文字列のJSON配列|live hitを取得|
|`⿰水青`|`200 cors`|`null`|live no-match|
|`⿰龜龜`|`200 cors`|`null`|live no-match候補|

HTTP error、timeout、JSON不正、空配列、Unicode文字列、non-UCS character objectはadapterのfixture/unit testsで分類した。今回のlive probeではnon-UCS character objectの返却は観測しなかった。CHISEのresponse形はAdapter内に留め、Coreには漏らさない。
