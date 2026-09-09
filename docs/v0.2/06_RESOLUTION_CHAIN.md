# Resolver Chain

IDSの文字解決順序は次のとおり。

```text
Explicit user provider
↓
Verified Known Character Index
↓
CHISE
↓
Local composition
↓
Source-preserving fallback
```

各providerは文字解決結果だけを返し、AST、Layout、DOM、CHISE ontologyを他責務へ漏らさない。既存の`resolveIds(ids, provider?)`呼び出しは維持し、Known Indexはoptional inputとして追加する。

providerのno-match・unavailable・例外はページ全体の失敗に昇格させず、次のresolverへ進める。ただし不正IDSはParser結果を優先してsourceを保持する。
