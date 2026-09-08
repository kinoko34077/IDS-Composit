# Stage 3 / Text Scanner

通常本文から `⟦...⟧` を検出する。

例:
`AAA⟦⿰木可⟧BBB`
→ text / composition / text

最低限除外:
- script
- style
- textarea

囲み外の本文を変更しない。
