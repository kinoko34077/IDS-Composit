# v0.2 Implementation Order

```text
v0.1 tag / Release
↓
compatibility gate
↓
docs / AGENTS / ADR
↓
Known Character Index engine + provenance policy
↓
native-first Resolver chain
↓
Spatial IDC coverage
↓
Known external-source importer / deterministic compact bulk artifact
↓
Known mapping expansion, provenance, and hit-rate report
↓
BabelStone source-specific importer / audit
↓
Yi Bai lv0/lv1/lv2 source-specific importers / audit
↓
Multi-Source merge / conflict report / 街 acceptance
↓
Optional full Known Index loader / Pages resolver telemetry
↓
Calibration sampling policy / multi-source corpus
↓
Calibration corpus / fixed font-em-baseline config / tools-only native-composition rasterizer / optimizer
↓
Generic Layout Profile
↓
runtime integration
↓
Pages comparison UI / resolver telemetry
↓
holdout validation
↓
performance / bundle regression
↓
v0.2 RC
```

各Source追加では、固定revisionまたはfile-date snapshot、SHA-256、license metadata、source-specific parser、generated artifact、audit report、malformed fixture、deterministic regeneration test、Current State、Traceabilityを揃える。Multi-Source mergeでは、conflict report、ambiguity test、alternate IDS test、`街` acceptanceを追加する。各段階で実装、unit/integration test、Pages/browser経路、Current State、Traceabilityを揃える。
