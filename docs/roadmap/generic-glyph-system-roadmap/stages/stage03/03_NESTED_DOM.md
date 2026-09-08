# Stage 3 / Nested DOM

AST/LayoutのネストをDOMにも再帰的に投影可能とする。

ただしDOM AdapterはIDSをparseしない。
受け取るのはLayout Modelのみ。
