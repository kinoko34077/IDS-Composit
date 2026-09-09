# CHISE IDS Inline Renderer

CHISE を文字情報基盤として利用し、IDS（Ideographic Description Sequence）を通常の Web 本文中で簡易合成表示する軽量ライブラリです。

## 現在の方針

文字情報・文字同定・IDS データベースを新規構築せず、CHISE を基盤として利用します。本プロジェクトは Web 表示層に限定し、CHISE で既存文字へ解決できる場合は native Unicode を優先し、未解決の場合に既存 Unicode 部品を DOM/CSS で合成します。

```text
本文 + ⟦IDS⟧
  → Scanner → Native Resolution (Provider → Known → CHISE)
  → Structural Parser/Coverage
  → native Unicode または Composition
  → Layout Model → DOM/CSS display
```

## ドキュメント

- [ドキュメント索引](docs/00_INDEX.md)
- [v0.2仕様章別索引](docs/v0.2/00_INDEX.md)
- [要求仕様](docs/01_REQUIREMENTS.md)
- [アーキテクチャ](docs/02_ARCHITECTURE.md)
- [CHISE 依存境界](docs/03_CHISE_DEPENDENCY.md)
- [現在の状態](docs/10_CURRENT_STATE.md)
- [Phase 6 visual validation記録](docs/validation/PHASE_06_VISUAL_VALIDATION.md)
- [Phase 9 hardening記録](docs/validation/PHASE_09_HARDENING.md)
- [Phase 9.2 refactor・optimization記録](docs/validation/PHASE_09_2_REFACTOR.md)
- [スマホ用Pages設計](docs/superpowers/specs/2026-09-09-mobile-pages-design.md)
- [スマホ用Pages実装計画](docs/superpowers/plans/2026-09-09-mobile-pages.md)
- [エージェント向け Phase 資料](docs/agent/PHASE_00_FOUNDATION.md)

旧方針の要件定義書・ロードマップは [docs/archive](docs/archive/) に保存しています。現在の仕様と混同せず、方針変更の履歴・参考資料として扱います。

## 現行スコープ外

独自 Glyph Registry、独自文字 DB、runtime SVG、runtime Canvas、KAGE、OpenType/WebFont 生成、IME、OS font fallback hook、独自文字コードは対象外です。Canvas/SVGはv0.2でも`tools/calibration/`の測定用途に限ります。

## Supported IDC

v0.2の構造処理で対応する空間IDCは次の14種類です。`⿾`（反転）と`⿿`（回転）は未対応で、元の `⟦IDS⟧` を保持して表示します。

|IDC|arity|構図|
|---|---:|---|
|`⿰`|2|左右|
|`⿱`|2|上下|
|`⿴`|2|外/内|
|`⿲`|3|左/中/右|
|`⿳`|3|上/中/下|
|`⿵`|2|上包み|
|`⿶`|2|下包み|
|`⿷`|2|左包み|
|`⿸`|2|左上包み|
|`⿹`|2|右上包み|
|`⿺`|2|左下包み|
|`⿻`|2|重ね合わせ|
|`⿼`|2|角包み|
|`⿽`|2|逆角包み|

`v0.1.0`の公開APIとfallback挙動を維持しながら、v0.2では出典付きKnown Character Index（初期手動seedは未検証candidate）、native-first resolver chain、Generic Layout Profileの校正基盤を追加しています。詳細は[v0.2仕様章別索引](docs/v0.2/00_INDEX.md)を参照してください。

## 開発状況

v0.1.0を公開済みです。Phase 0〜9.2の実装（CHISE Adapter、local fallback、三項IDC、公開ESM/browser package、MutationObserver、contenteditable policy、cache hardening、a11y/copy、Release Audit、内部責務分離、targeted optimization）をv0.1互換基準として固定しています。現在の開発版は`0.2.0-dev.0`で、v0.2のKnown Index、14 spatial IDC、native-first resolver chain、calibration foundationを実装中です。観測結果と未決定事項は [Phase 6 visual validation記録](docs/validation/PHASE_06_VISUAL_VALIDATION.md)、[Phase 9 hardening記録](docs/validation/PHASE_09_HARDENING.md)、[Phase 9.2 refactor・optimization記録](docs/validation/PHASE_09_2_REFACTOR.md) に記録しています。

## スマートフォンからの確認

GitHub Pagesの入口: <https://kinoko34077.github.io/IDS-Composit/>

入口ではIDSの直接入力、候補select、local composition / CHISE native優先の切替、対応パターン一覧を試せます。詳細ページへ直接移動する場合は、[Basic](https://kinoko34077.github.io/IDS-Composit/basic.html)、[Visual validation](https://kinoko34077.github.io/IDS-Composit/validation.html)、[CHISE live / CORS preflight](https://kinoko34077.github.io/IDS-Composit/chise-preflight.html)、[Consumer demo](https://kinoko34077.github.io/IDS-Composit/consumer.html)を使用してください。

初回のみRepositoryのSettings → Pages → Build and deployment → Sourceで`GitHub Actions`を選択します。以後は`main`へのpushで`.github/workflows/pages.yml`がlibrary build後にPagesを更新します。

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
