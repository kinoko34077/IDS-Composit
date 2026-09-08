# CHISE IDS Inline Renderer

CHISE を文字情報基盤として利用し、IDS（Ideographic Description Sequence）を通常の Web 本文中で簡易合成表示する軽量ライブラリです。

## 現在の方針

文字情報・文字同定・IDS データベースを新規構築せず、CHISE を基盤として利用します。本プロジェクトは Web 表示層に限定し、CHISE で既存文字へ解決できる場合は native Unicode を優先し、未解決の場合に既存 Unicode 部品を DOM/CSS で合成します。

```text
本文 + ⟦IDS⟧
  → Scanner → Parser → CHISE Resolver
  → native Unicode または Composition
  → Layout Model → DOM/CSS display
```

## ドキュメント

- [ドキュメント索引](docs/00_INDEX.md)
- [要求仕様](docs/01_REQUIREMENTS.md)
- [アーキテクチャ](docs/02_ARCHITECTURE.md)
- [CHISE 依存境界](docs/03_CHISE_DEPENDENCY.md)
- [現在の状態](docs/10_CURRENT_STATE.md)
- [Phase 6 visual validation記録](docs/validation/PHASE_06_VISUAL_VALIDATION.md)
- [Phase 9 hardening記録](docs/validation/PHASE_09_HARDENING.md)
- [Phase 9.2 refactor記録](docs/validation/PHASE_09_2_REFACTOR.md)
- [エージェント向け Phase 資料](docs/agent/PHASE_00_FOUNDATION.md)

旧方針の要件定義書・ロードマップは [docs/archive](docs/archive/) に保存しています。現在の仕様と混同せず、方針変更の履歴・参考資料として扱います。

## 現行スコープ外

独自 Glyph Registry、独自文字 DB、SVG、Canvas、KAGE、OpenType/WebFont 生成、IME、OS font fallback hook、独自文字コードは現行 v0.1 の対象外です。

## Supported IDC

v0.1で対応するIDCは次の5種類です。未対応IDCは元の `⟦IDS⟧` を保持して表示します。

|IDC|arity|構図|
|---|---:|---|
|`⿰`|2|左右|
|`⿱`|2|上下|
|`⿴`|2|外/内|
|`⿲`|3|左/中/右|
|`⿳`|3|上/中/下|

## 開発状況

Phase 0〜9.2の実装（CHISE Adapter、local fallback、三項IDC、公開ESM/browser package、MutationObserver、contenteditable policy、cache hardening、a11y/copy、Release Audit、内部責務分離）まで完了しています。観測結果と未決定事項は [Phase 6 visual validation記録](docs/validation/PHASE_06_VISUAL_VALIDATION.md)、[Phase 9 hardening記録](docs/validation/PHASE_09_HARDENING.md)、[Phase 9.2 refactor記録](docs/validation/PHASE_09_2_REFACTOR.md) に記録しています。

## 利用例

```html
<link rel="stylesheet" href="node_modules/chise-ids-inline-renderer/style.css" />
<script type="module">
  import { observeIds, renderIds } from 'chise-ids-inline-renderer';
  await renderIds(document.body);
  const observer = observeIds(document.body);
</script>
```

`renderIds`は既定でネットワークを使わずlocal compositionを行います。CHISEのnative解決を有効にする場合は`await renderIds(document.body, { chise: true })`とし、テストや独自backendでは`provider`を注入できます。CHISEのno-match・timeout・障害はlocal compositionへfallbackします。

動的DOMは`observeIds(document.body)`で監視でき、不要になったら`observer.stop()`します。`contenteditable`は既定で変更せず、必要な場合だけ`{ contentEditable: true }`を指定します。単一の合成glyph全体を選択してcopyした場合は元の`⟦IDS⟧`を復元します。複数glyphを跨ぐ選択や部分選択の再構成は保証しません。

## License

MIT Licenseです。詳細は [LICENSE](LICENSE) を参照してください。
