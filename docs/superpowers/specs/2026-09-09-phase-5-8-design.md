# IDS-Composit Phase 5-8 Design

日付: 2026-09-09

## 目的

Phase 5〜8を、既存のparser・composition・DOM rendererを壊さずに実装する。
CHISEは文字同定の外部依存としてAdapterへ閉じ込め、CHISEで表示可能なUnicode文字が得られた場合だけnative表示を優先する。no-match、非Unicode文字オブジェクト、timeout、HTTP/JSONエラーはlocal compositionへ移行する。

## 非対象

- 独自文字DB、Glyph Registry、CHISEデータの大量同梱
- SVG、Canvas、KAGE、GlyphWiki字形生成、OpenType/WebFont生成
- CHISEのレスポンスをCoreのontologyとして保存すること
- Phase 6の観測前に行う個別字形補正
- Phase 7で全17 IDCを一括実装すること

## 境界とデータフロー

```text
embedded text
  ↓ scanEmbeddedIds / parseIds
valid IDS source
  ↓ resolveIds(source, provider)
CHISE native string ───────→ native text node
no-match/unavailable
  ↓
AST ─→ composeLayout ─→ renderLayout
invalid/internal failure ─→ raw ⟦IDS⟧
```

Parser、Composition、Variant、LayoutはHTTPとDOMを知らない。CHISE AdapterはCoreの`IdsMatchResult`だけを返し、DOMへ依存しない。

## Phase 5: CHISE Adapter / Resolver

### Provider interface

```ts
interface CharacterKnowledgeProvider {
  matchIds(ids: string): Promise<IdsMatchResult>;
}

type IdsMatchResult =
  | { found: true; text: string; raw?: unknown }
  | { found: false }
  | { found: false; unavailable: true; error?: unknown };
```

`ids-match`の既定endpointは`https://api.chise.org/v0/character/ids-match`とする。仕様書で示されるJSON `null`はno-match、Unicode文字列はnative候補、非UCSのCHISE文字オブジェクトはこのrendererでは表示可能なnative文字ではないためcompositionへ送る。未知のJSON形状はunavailableとして扱う。

Providerは`fetch`、endpoint、timeout、メモリcacheを注入可能にする。cache keyはNFC正規化済みIDS文字列とし、成功/no-matchだけをTTL内に保存する。unavailableは保存しない。

### Resolver

```ts
resolveIds(ids: string, provider?: CharacterKnowledgeProvider): Promise<Resolution>
```

有効なIDSを先にparseし、providerがnative候補を返した場合は`native`を返す。それ以外は同じASTを`compose`として返す。CHISE unavailableの場合は`compose.diagnostic.kind = 'chise-unavailable'`を付与し、内部parse failureは`unresolved`として理由を返す。

## Phase 6: Visual Validation

固定corpusをHTML sampleへ配置する。既存の5例に、三項構造・高画数・左右/上下密度差を加える。複数fontの切替を可能にし、観測結果をfailure classification（ratio、variant、font、baseline、圧縮限界、parser/structure）として文書化する。補正値は観測結果と対応付けられるものだけ追加する。

## Phase 7: 必要IDCの追加

Unicodeの現行IDC分類に従い、Phase 6のcorpusで必要な三項IDC `⿲` と `⿳`を追加する。各IDCについてarity、structural role、relative geometryをデータ表へ追加し、parser・layout・DOMの回帰テストを通す。囲み・overlay・unary operatorは利用例と視覚検証で必要になるまで未実装のままとする。

## Phase 8: 公開API / Packaging

consumerが使う入口を`src/public-api.ts`へ集約する。

```ts
type RenderIdsOptions = {
  chise?: boolean;
  provider?: CharacterKnowledgeProvider;
  chiseOptions?: ChiseProviderOptions;
};

renderIds(root: HTMLElement, options?: RenderIdsOptions): Promise<void>;
```

`chise`がfalseまたは未指定ならネットワークなしのlocal composition、trueなら既定CHISE provider、`provider`指定時はそのproviderを使用する。consumerはAST、Layout、CHISE responseを直接扱わない。既存の同期`renderIdsInElement`はlocal fallback用途として保持する。

ESMライブラリbundle、型宣言、CSS asset、package exports、空HTMLのconsumer demoを作る。公開packageには大量CHISE dataを含めない。bundle sizeはbuild後の出力ファイルで確認する。

## 受入条件の対応

|Phase|受入条件|
|---|---|
|5|CHISE hitはnative、no-match/unavailableはcomposition、外部失敗をdiagnosticで区別、fixtureでoffline再現|
|6|固定corpus・複数font・nested例・failure classificationが文書化される|
|7|corpusで必要な三項IDCがデータ駆動でparse/layout/renderできる|
|8|空HTMLから`renderIds`だけで導入でき、consumerが内部型を知らずに利用できる|
