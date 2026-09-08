# Stage 1 / Grammar

## P0
- leaf: Unicode文字1要素
- binary IDC: `⿰`, `⿱`, `⿴`
- 再帰ネストを許可

例:
`⿰木可`
`⿰木⿱日月`

Parserは前置記法としてIDCごとのarityに従い再帰的に消費する。
