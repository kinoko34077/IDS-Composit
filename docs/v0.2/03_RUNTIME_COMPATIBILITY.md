# v0.1 Runtime Compatibility

## 維持する公開挙動

- `renderIds()`、`observeIds()`、provider injection、`maxConcurrency`。
- 内部resolverの`resolveIds(ids, provider?)`呼び出しを維持し、v0.2では任意の第三引数としてKnown Indexを追加できる。
- invalid IDS、unsupported IDS、CHISE failure時のsource保持またはlocal fallback。
- `contenteditable` default-offとopt-in。
- 単一glyphのcopy source復元と既存accessibility metadata。
- nested composition、MutationObserverのstop、cacheの既存契約。
- Pagesの既存入口とlibrary build。

valid IDSがv0.1のlocal compositionからv0.2のKnown Index/native Unicodeへ改善されることは互換違反ではない。

## Compatibility gate

`tests/compat/`で上記の公開経路を固定する。v0.2の内部module分割はこのテストを壊してはならない。
