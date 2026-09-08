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
