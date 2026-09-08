# Requirement Traceability

|Requirement|主実装領域|主テスト|
|---|---|---|
|REQ-001|CHISE Adapter|adapter fixture/live smoke|
|REQ-002|Scanner / Parser|scanner integration|
|REQ-003|Resolver|native resolution test|
|REQ-004|Resolver / Composition|no-match fallback|
|REQ-005|DOM Adapter|browser DOM test|
|REQ-006|DOM Adapter|visual test|
|REQ-007|Parser / Layout|nested AST/layout|
|REQ-008|Variant Resolver|variant unit test|
|REQ-009|Variant Resolver|unknown variant test|
|REQ-010|Layout Store|layout snapshot|
|REQ-011|data tables|data-change regression|
|REQ-012|Core module boundaries|architecture/code review|
|REQ-013|Resolver|CHISE outage test|
|REQ-014|Scanner/DOM Adapter|error fallback test|
|REQ-015|Packaging|consumer demo|

実装開始後、実ファイル・テスト名を追記する。現在は設計上の対応表のみ。
