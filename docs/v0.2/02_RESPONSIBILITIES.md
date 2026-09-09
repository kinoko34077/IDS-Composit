# v0.2 Responsibilities and Boundaries

```text
Text
 ↓
A Runtime Scanner
 ↓
Thin Orchestrator
 ├─ C Known Character Resolver → native Unicode
 ├─ B Structural Coverage      → AST / roles
 └─ D Layout Profile            → Layout Model
 ↓
A Runtime DOM/CSS Renderer
```

## Boundary rules

- ParserはDOMを知らない。
- Structural CoverageはKnown Index、CHISE、DOMを知らない。
- Known IndexはLayout、DOM、CHISE ontologyを知らない。
- Layout ProfileはCHISEとCalibration Engineを知らない。
- Calibration ToolはKnown Index・Coverage・measurement rendererを読むが、production runtimeからimportされない。
- Runtime APIはIDS DB、corpus、font解析、文字別配置DBを所有しない。
