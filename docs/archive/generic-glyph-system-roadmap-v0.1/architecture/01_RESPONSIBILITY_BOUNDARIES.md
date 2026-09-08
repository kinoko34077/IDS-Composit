# Responsibility Boundaries

## Parser
入力IDSをASTへ変換するだけ。
禁止: DOM / CSS / Registry / Unicode lookup / Layout比率。

## Role Resolver
IDCから `left/right/top/bottom/outer/inner` 等を付与。
禁止: 実表示。

## Variant Resolver
`(baseCharacter, structuralRole) → displayCharacter`。
未定義時はbaseを返す。

## Layout Template Store
IDCごとの相対矩形を保持。
値はデータとして変更可能。

## Composition Engine
AST + role + variant + templateからLayout Modelを生成。
禁止: DOM / SVG / Registry API。

## Registry
Stable ID・mapping・representation・metadataを管理。
IDSは任意mappingの一つ。

## Resolver
Unicode / Registry / Compositionのどれを使うか決める。

## Renderer
Glyph/LayoutをSVG等の表現へ変換。
Registryの正本管理はしない。

## DOM Adapter
Layout ModelをHTML/CSSへ投影。
Composition規則を持たない。
