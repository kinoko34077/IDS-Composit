# Resolver Chain

IDSの文字解決順序は次のとおり。Native resolutionはlocal structural coverageとは独立して実行するため、local parserが未対応のIDCでも、providerまたはKnown Indexが知っていればnativeへ解決できる。

```text
Explicit user provider
↓
Verified Known Character Index
↓
CHISE
↓
miss
↓
Structural Parser / Coverage
↓
Local composition
↓
Source-preserving fallback
```

各providerは文字解決結果だけを返し、AST、Layout、DOM、CHISE ontologyを他責務へ漏らさない。既存の`resolveIds(ids, provider?)`呼び出しは維持し、Known Indexはoptional inputとして追加する。

providerのno-match・unavailable・例外はページ全体の失敗に昇格させず、次のresolverへ進める。閉じたIDS sourceはlocal structural coverage外でもnative問い合わせへ渡し、全native miss後にParser結果を評価してsourceを保持する。
