# Architecture Decision Records

## ADR-001 CHISEを文字基盤として採用

Status: Accepted

### 判断
独自の文字DB・文字ontology・Generic Glyph Registryを作らず、CHISEを文字情報基盤として利用する。

### 理由
- IDS・文字構造・既存文字対応の大部分が既にCHISEに存在する。
- 独自基盤はCHISEとの重複が大きい。
- 本プロジェクトの固有価値はWeb表示runtimeにある。

### 不採用
独自Generic Glyph Registry。

### 再検討条件
CHISEでは満たせない具体的要件が実測で確認された場合。

---

## ADR-002 IDSを構造入力として利用

Status: Accepted

### 判断
独自漢字構造DSLを作らずIDSを使用する。

### 理由
Unicode/CHISE既存体系との互換を優先する。

---

## ADR-003 SVG-firstを不採用

Status: Accepted

### 判断
初期rendererはSVGを生成せずDOM/CSSで既存font glyphを配置する。

### 理由
まず最小コストで合成方式の成立性を検証するため。

### 再検討条件
DOM/CSS方式では必要な表示品質・性能を満たせないことが実測された場合。

---

## ADR-004 CompositionとCHISE Resolverを分離

Status: Accepted

### 判断
CHISE問い合わせをComposition Engine内部へ入れない。

### 理由
外部API変更とlayout変更の変更理由が異なるため。

---

## ADR-005 Native Unicode優先

Status: Accepted

### 判断
CHISEで既存文字へ解決できる場合はnative textを優先する。

### 理由
既存Web text pipeline・font fallback・検索・選択を最大限利用するため。

---

## ADR-006 Layoutは当面構図ごと固定

Status: Accepted

### 判断
Phase 0では字ごとの最適化をせず、IDC単位の固定比率を使う。

### 理由
先に単純方式の限界を測るため。

---

## ADR-007 v0.1をv0.2互換基準APIとして保持

Status: Accepted

`v0.1.0` tagのRuntime API、fallback、DOM integration、Observer、copy/accessibilityをv0.2でも維持する。既知IDSがnative Unicodeへ改善されることは互換違反としない。

## ADR-008 Known Character IndexはCHISE補完Indexとする

Status: Accepted

出典付きmany-to-many mappingを`generated`/`manual`に分離して保持する。ただしCHISE ontology、独自Character ID、Glyph Registryへ拡張しない。verifiedの曖昧候補は勝手に確定しない。

## ADR-009 CalibrationではCanvas/SVGを開発用途に限定許可

Status: Accepted

native/compositionのraster測定、loss計算、optimizer、reportは`tools/calibration/`に限定する。production runtime rendererはDOM/CSSを維持する。

## ADR-010 個別最適化からGeneric Profileを導出

Status: Accepted

既知字の個別placementは教師evidenceとして保存し、IDC/Structural Role単位で集計したProfileだけを未知字runtimeへ適用する。既知字はnative Unicodeを優先する。

## ADR-011 v0.2資料を章別管理する

Status: Accepted

v0.2要件は`docs/v0.2/00_INDEX.md`から章単位で参照し、受領原文は`docs/v0.2/source/`へ保全する。root正本には重複全文を置かず、変更理由と参照リンクだけを記録する。

---

## ADR-012 Resolver KnownとCalibration Sourceを分離

Status: Accepted

### 判断

`known-index-v0.2.json`はnative Resolver専用とし、CalibrationはBabelStone/CHISE `@apparent`/Yi Bai lv0のsource adapterから専用`CalibrationSourceRecord`を生成する。

### 理由

文字同定としてのverified、functional IDS、地域variant、実glyph教師としての適格性は同じ判定ではない。Unified Indexをそのまま教師にすると、地域情報・apparent情報・ambiguityの意味が失われる。

### 境界

Calibration固有のrole・sampling・raster evidenceをResolver runtime型へ持ち込まない。既存Known/corpus artifactは履歴・比較用に保持する。

## ADR-013 v0.2 Calibration地域をJPへ固定

Status: Accepted

v0.2.0の教師・ProfileはJPだけを対象とする。CN/TW/HK/KRの地域差はmetadataを失わず保持するが、別Profileを先回りして生成しない。

## ADR-014 Source Han Sans JPをtraining referenceにする

Status: Accepted

配置最適化はSource Han Sans JP 2.005R Regular static OTFで行う。OSのsystem fontやfont fallbackを教師にしない。

## ADR-015 Source Han Serif JPはcross-font validation専用

Status: Accepted

Source Han Serif JP 2.003R Regular static OTFへSans由来Profileをそのまま適用し、学習へ混ぜず、汎用性のcross-font Gateだけを確認する。

## ADR-016 Known verifiedとCalibration eligibilityを分離

Status: Accepted

Knownの`verified/candidate`は文字同定の状態であり、glyph形状教師の適格性を意味しない。Calibrationはsource role、Unicode leaf、ambiguity、font coverageを独自に判定する。

## ADR-017 character hashでtrain/holdoutを分割

Status: Accepted

NFC(character)のSHA-256先頭32bit mod 100を使い、0〜19をholdout、20〜99をtrainとする。同一characterのalternateは同じpartitionに固定する。

## ADR-018 ambiguityはtrainingから除外

Status: Accepted

同一normalized IDSが複数characterへ対応する場合、primary/alternateのどちらにも入れずdiagnosticへ残す。多数決やconfidence scoreで解決しない。

## ADR-019 Generic Profileはmedianで集約

Status: Accepted

operator/role/slotごとのx/y/width/heightはcoordinate-wise medianをruntime値とする。meanや分位点はreportへ残すが、先に本番方式へ固定しない。

## ADR-020 Profile採用はoperator単位Gate

Status: Accepted

train>=80、holdout>=20を満たすoperatorだけを候補とし、Sans median改善・p75非悪化、Serif median/p75非悪化を個別に確認する。未達operatorはv0.1 fixed templateへfallbackする。

## ADR-021 raw evidenceをruntimeへ持ち込まない

Status: Accepted

per-character raster、optimizer結果、mask、巨大corpusは`.artifacts/calibration/`へ置き、Git/runtime/npm packageへ入れない。runtimeへ統合するのはGateを通った小さなGeneric Profileだけとする。
