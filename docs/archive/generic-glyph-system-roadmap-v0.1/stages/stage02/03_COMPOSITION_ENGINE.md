# Stage 2 / Composition Engine

入力:
- AST
- role
- variant結果
- layout template

出力:
- Layout Model

責務:
- 再帰的領域分割
- 相対座標の合成
- child配置

禁止:
- DOM生成
- SVG生成
- Registry lookup
