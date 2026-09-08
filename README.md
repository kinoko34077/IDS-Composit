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
- [エージェント向け Phase 資料](docs/agent/PHASE_00_FOUNDATION.md)
- [Phase 6 visual validation記録](docs/validation/PHASE_06_VISUAL_VALIDATION.md)

旧方針の要件定義書・ロードマップは [docs/archive](docs/archive/) に保存しています。現在の仕様と混同せず、方針変更の履歴・参考資料として扱います。

## 現行スコープ外

独自 Glyph Registry、独自文字 DB、SVG、Canvas、KAGE、OpenType/WebFont 生成、IME、OS font fallback hook、独自文字コードは現行 v0.1 の対象外です。

## 開発状況

Phase 0〜8の実装（CHISE Adapter、local fallback、三項IDC、公開ESM/browser package）まで完了しています。複数fontの目視判定は [Phase 6 visual validation記録](docs/validation/PHASE_06_VISUAL_VALIDATION.md) のmanual項目です。次の作業はPhase 9 hardeningです。

## 利用例

```html
<link rel="stylesheet" href="node_modules/chise-ids-inline-renderer/style.css" />
<script type="module">
  import { renderIds } from 'chise-ids-inline-renderer';
  await renderIds(document.body);
</script>
```

`renderIds`は既定でネットワークを使わずlocal compositionを行います。CHISEのnative解決を有効にする場合は`await renderIds(document.body, { chise: true })`とし、テストや独自backendでは`provider`を注入できます。CHISEのno-match・timeout・障害はlocal compositionへfallbackします。

## License

ライセンスは未決定です。
