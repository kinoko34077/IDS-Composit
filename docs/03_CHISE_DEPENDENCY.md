# CHISE Dependency Specification

## 1. 位置付け

CHISE（CHaracter Information Service Environment）を、本プロジェクトの文字情報・文字同定側の基盤として利用する。

本ライブラリはCHISEを「丸ごとクライアントへ再実装する」のではなく、必要な問い合わせをAdapter経由で利用する。

## 2. 現行確認済みWeb API

2026-09-08時点で確認したCHISE / Concord Web API v0.4には、少なくとも以下がある。

```text
GET https://api.chise.org/v0/character/ids-match?ids=<IDS>
GET https://api.chise.org/v0/character/get?character=<character>&feature=<feature>
GET https://api.chise.org/v0/character/get-spec?character=<character>
GET https://api.chise.org/v0/character/encode?character=<character>&ccs=<CCS>
```

本プロジェクトの最初の主要依存は `ids-match`。

2026-09-09のlive smokeでは、`ids-match`は一致結果をUnicode文字列のJSON配列（例：`["字"]`）として返した。Adapterはこの実レスポンスを第一候補のnative文字へ正規化し、空配列をno-matchとして扱う。仕様資料・fixtureとの互換のため、単一Unicode文字列も受理する。

同日、ブラウザから `/chise-preflight.html` を実行し、`⿰氵⿱木日`、`⿰水青`、`⿰氵青`、`⿰龜龜` の全てで `200 cors` を確認した。`⿰氵⿱木日` と `⿰氵青` はUnicode文字列配列、`⿰水青` と `⿰龜龜` は `null` だった。これはlive時点の観測であり、response ontologyをCoreへ取り込む根拠にはしない。

参考：
- CHISE / Concord Web API 説明書 v0.4
- https://www.chise.org/specs/chise-web-api_v0.4_ja.pdf

## 3. Adapter

外部APIは以下のような最小interfaceへ正規化する。

```ts
interface CharacterKnowledgeProvider {
  matchIds(ids: string): Promise<IdsMatchResult>;
}

type IdsMatchResult =
  | { found: true; text: string; raw?: unknown }
  | { found: false }
  | { found: false; unavailable: true; error?: unknown };
```

具体レスポンス形式をCoreへ漏らさない。

## 4. Resolver規則

```text
IDS
↓
CHISE ids-match
├─ usable native character found
│   → native
├─ no match
│   → compose
└─ unavailable/error
    → compose + diagnostic
```

API障害はCompositionを止めない。

## 5. Query normalization

入力の正本は常に元のIDS文字列とする。CHISE照合時だけAdapter内でParserの構造roleとVariant Mapを参照し、raw queryを位置variant適用済みqueryへ正規化する。例えば `⿰水青` は表示・fallback・`sourceIds`を変更せず、CHISEへの問い合わせでは `⿰氵青` を第一候補とする。

この正規化はCHISE問い合わせ専用であり、Parser/CoreのASTやDOM表示へ逆流させない。cacheとin-flight重複排除のkeyも正規化後のqueryとするため、raw queryと同じ意味のvariant queryを同時に問い合わせない。

## 6. Cache

同じIDSに対する繰返し問い合わせを避けるためcacheを許可する。

最低限のcache key：

```text
normalized IDS string
```

cacheはCHISEの代替正本ではない。

TTL、永続化方式は実装時に決める。無期限の独自DB化を避ける。

## 7. Local Fixtures

テスト安定性のため、CHISE応答fixtureを保存してよい。

fixtureの目的：

- Adapter unit test
- offline CI
- response parser regression

fixtureを網羅DBとして増やさない。

## 8. API変更

CHISEのAPIやレスポンス仕様が変化した場合：

1. Adapter integration testで検出
2. 現行CHISE仕様を再確認
3. Adapterのみ修正
4. Core testsを回帰
5. 必要ならADR/Current State更新

## 9. ライセンス・再配布

CHISEデータをbundleへ大量同梱する場合は、実装前に対象データ・コードのライセンスと再配布条件を個別確認する。

本v0.1は大量同梱を前提としない。
