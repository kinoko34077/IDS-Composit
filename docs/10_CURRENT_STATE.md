# Current State

Updated: 2026-09-10

## 現在段階

**v0.1.0 released / v0.2.0-dev.0 Calibration実測基盤 C0〜C17**

## 最新確定方針

- 文字情報基盤はCHISEへ依存する。
- IDSを入力表現として利用する。
- 独自Registryを作らない。
- 本プロジェクトは簡易Web rendering/composition layerへ限定する。
- CHISEで既存文字へ解決できればnative Unicode優先。
- 未解決なら既存Unicode部品をDOM/CSSで強引に配置する。
- `水→氵`等の位置variantを表示時に適用する。
- v0.1 fixed templateの構図比率は互換fallbackとして維持し、v0.2 profileは実データとholdout gate後に未知字へ限定適用する。
- SVG/KAGE/Canvas/font生成はruntime対象外。Canvas/SVGは`tools/calibration/`の測定用途だけ許可する。
- v0.1.0はcommit `25e0449`を正本としてtag・GitHub Release済み。v0.2作業では公開APIとv0.1挙動を互換基準として保持する。
- v0.2のbulk Known dataはruntime/default bundleへ自動同梱せず、Sourceごとのartifact・notice・明示hydrateを境界とする。

## 実装済み

- Phase 0 Foundation: TypeScript/Vitest 基盤、Core型、IDC/Layout/Variantデータ境界、サンプルページ
- Phase 1 IDS Parser: `⟦...⟧` scanner、`⿰`/`⿱`/`⿴` の再帰Parser、parse error、本文保持 fallback
- Phase 2 Composition Core: structural role、固定Layout Template、相対座標の再帰Layout Model
- Phase 3 DOM Inline Renderer: 本文Scanner、1em inline box、入れ子DOM、script/style/textarea除外、Viteサンプルページ
- Phase 4 Position Variants: data-driven Variant Map、seed mappings、base character fallback、Compositionへのvariant適用
- Phase 4.5 Correctness: glyph本体のscale、Role/geometry分離、局所renderer fallback、README/Traceability同期、最小CI
- Phase 5 CHISE Adapter / Resolver: `ids-match` response normalization、injected fetch、timeout/HTTP/JSON failure、TTL memory cache、native優先、local composition fallback、unavailable diagnostic
- Phase 6 Visual Validation: 固定corpus、複数font切替sample、browser目視とfailure classification記録
- Phase 7 IDS Coverage: Unicode trinary IDC `⿲` / `⿳` のarity・role・relative geometry、parser/layout/DOM回帰テスト
- Phase 8 Packaging: `renderIds`公開API、ESM/browser bundle、型宣言、CSS asset、package exports、consumer demo
- Phase 8.5 Validation: nested absolute scale回帰、Phase 6 browser visual record、CHISE live/CORS preflight、response fixture分類
- Phase 9 Hardening: `observeIds` MutationObserver、contenteditable default-off/opt-in、TTL/max/clear memory cache、a11y metadata、IDS copy fallback、vertical writing investigation、performance profile tests
- Phase 9.1 Release Audit: CHISE query-only variant normalization、unique IDSのbounded parallel resolve、normalized query単位のin-flight dedupe、実ブラウザ単一glyph copy確認、Supported IDC/LICENSE/CI gate整備
- Phase 9.2 Internal Refactor: Layout→DOM、Text Node document rendering、copy/a11y、batch resolve、MutationObserverを責務別moduleへ分離。公開API・既存内部adapterの挙動は維持し、不要な`dom-renderer.ts` compatibility barrelを削除
- Phase 9.2 Optimization Pass: providerなしの`renderIds`/`observeIds`は同期local composition経路を使用。MutationObserverは同一callback内の追加を親要素へ集約し、containment dedup後にrenderする。公開API・CHISE有効時のasync batch semanticsは維持
- Mobile GitHub Pages: `examples/index.html`のスマホ確認入口、IDS入力・候補select・`Local only`/`CHISE API`/`Full Known Index`/`Full Known + CHISE`切替・パターン一覧、Pages専用multi-page build、main push deploy workflowを追加。Full Known artifactは選択時だけ遅延ロードし、Known lookup/CHISE照会有無/native・composition・fallbackのtelemetryを表示する。入口URLは`https://kinoko34077.github.io/IDS-Composit/`
- v0.2 Documentation: 新要件を`docs/v0.2/`の章別文書へ分割し、`docs/v0.2/00_INDEX.md`を参照入口とした。原資料は`docs/v0.2/source/`に保存。
- v0.2 Compatibility: `tests/compat/v0-1-runtime.test.ts`で公開API、fallback、contenteditable、provider障害、observer停止、copy/a11y metadataの基準を固定。
- v0.2 Known Character Index: NFC lookup key、出典付きverified/candidate、many-to-many lookup、ambiguity handlingを実装。初期手動seed `⿲彳圭亍 → 街`は外部確認待ちのcandidateとして保持し、native/Calibrationから除外。external source artifactの決定的generator、compact bulk artifactの明示hydrate境界も追加。
- v0.2 CHISE IDS importer: CHISE IDS公式GitHubミラーの抽象文字ファイル16本を固定revisionからbounded parallel downloadし、機能IDSだけをverified recordへ変換。`@apparent`は機能mappingへ入れず、機能IDS欠損1件はwarningとして保持。初回artifact `data/known/generated/chise-ids-v0.2.json` は101,995 records（6,130,537 bytes）、report `data/known/reports/chise-ids-v0.2.json` は重複0、ambiguity 160、unique IDS 101,833、一意解決率99.842880%、issues 0、warnings 1を記録する。artifactはruntime/npm packageへ自動importしない。
- v0.2 BabelStone importer: file-date snapshot `Unicode 16.0 / 2025-06-27`をsource-specific parserで取得し、地域tagを`variantTag`へ保持、`{n}`/`？`等のspecial componentをcandidate、local未対応でも構造有効な`⿾`/`⿿`/`㇯`をnative lookup用verifiedとして保持する。artifactは108,408 unique pairs（verified 105,756 / candidate 2,652）、unique IDS 108,184、ambiguity 210、issues 0で、`街 → ⿲彳圭亍`を含む。
- v0.2 Yi Bai importer: 固定revision `13081e8b223b740fcc234780b95a386d895fbf16d`からlv0/lv1/lv2を別artifactへ生成。lv0 122,157、lv1 116,960、lv2 116,736 unique pairsを記録し、primary/alternative・source marker・special syntaxを保持する。lv0/lv1は初期candidate、lv2はplain Unicode IDSだけをverifiedとし、Calibration用途とKnown resolver用途を混同しない。
- v0.2 Multi-Source merge: CHISE・BabelStone・Yi Bai lv2を`data/known/generated/known-index-v0.2.json`へ決定的mergeし、155,442 unique pairs（verified 151,769 / candidate 3,673）、unique IDS 153,916、unique characters 102,032、single-source 56,636、multi-source corroborated 98,806、same character / multiple IDS 38,362、same IDS / multiple characters 1,390を監査reportへ記録する。`⿴行圭 → 街`（CHISE/Yi Bai）と`⿲彳圭亍 → 街`（BabelStone）の双方を明示hydrate後にnative resolveできる。
- v0.2 Calibration sampling policy: Unified KnownをCalibrationの正本入力にせず、BabelStone direct-J、CHISE `@apparent`、Yi Bai lv0のsource-specific recordから選別する。BabelStone direct-J → CHISE apparent → Yi Bai lv0の優先順位でcharacterごとにprimaryを最大1件選び、alternate・diagnostic・excludedを分離。同rankはNFC IDSのlexical orderで安定化し、ambiguous IDSはtrainingから除外する。新source corpusは`corpus-multisource-v0.2.json`やCHISE baselineとは別の`calibration-source-corpus-v0.2.json`として生成する。
- v0.2 Resolver Chain: explicit provider → verified Known Index → CHISE → structural Parser/Coverage → local composition → source fallbackの順序を実装。local未対応IDCでもnative問い合わせへ到達し、既存`resolveIds(ids, provider?)`を維持しながら任意のKnown Index引数を追加。
- v0.2 Resolver/Index hardening: scannerは閉じたunsupported IDCをnative問い合わせ可能なIDS segmentとして保持。explicit provider miss後のCHISE fallback、Known IndexのNFC lookup、原文provenance保持、external source generator、manual candidate policyを回帰テスト付きで固定。
- v0.2 Structural Coverage: 14 spatial IDCのarity/role/layout/DOM処理をデータ駆動で追加。`⿾`/`⿿`は未対応のまま。
- v0.2 Calibration Foundation: `CalibrationSourceRecord`、ambiguity filter、character SHA-256 split、font manifest/hash、fontkit coverage gate、Skia raster backend、root em geometry、Loss v1、multi-resolution optimizer、median profile、operator別Sans/Serif holdout gateを実装した。source corpusの生成結果はinput 332,963、eligible 136,943、primary 101,076（cap後32,365）、alternate 35,867、diagnostic 102,544、excluded 93,476で、source hash/provenanceを保持する。⿰は実font測定でSans/SerifともGateを通過し、accepted profileだけをruntimeへ統合した。Canvas/fontkitは`tools/calibration/`専用で、production runtimeへ依存を導入していない。
- v0.2 Calibration measurement: Source Han Sans JP 2.005Rをtraining、Source Han Serif JP 2.003Rをcross-font validationに固定。160×160 canvas、128×128 root em、16px padding、font metrics baseline、target/leaf glyph coverageを用いる。⿰のholdoutはSans median 0.14087754→0.11150787、p75 0.15653761→0.12823016、Serif median 0.15715093→0.13619011、p75 0.17525171→0.15264171で`accept / passed`となった。個別raster/optimization evidenceはGitへ入れず、runtimeにはGeneric profileのみを出力する。
- v0.2 Calibration Source Boundary C0〜C4: `CalibrationSourceRecord`をKnown statusから分離し、BabelStone direct-J/X/Z、CHISE `@apparent`/functional、Yi Bai lv0 primary/alternativeをsource-specific adapterで分類する。NFC IDS ambiguityはdiagnosticへ残してtrainingから除外し、1 character 1 primaryとSHA-256 character単位80/20 splitを`tools/calibration/select.ts`、`split.ts`、`generate-source-corpus.ts`へ固定した。既存Unified Known/corpusはCalibration正本にせず保持している。
- Mobile Pages v0.2 surface: 14 spatial IDC、Known candidate/nativeの区別、local composition、未対応IDCのsource-preserving fallbackを入力・候補・一覧で試せる状態へ更新。Full Known modeでは統合artifactの`⿲彳圭亍 → 街`を含むnative hit、CHISE not queried、結果表示を確認できる。巨大artifactはnpm packageへ入れず、Pages buildへassetとして出力し、dev serverでは同じURLを読み取り専用middlewareで配信する。

## 運用観測 / 次作業

v0.2 first-slice commit `7f62c6e` のGitHub Actions CI Run #25とPages Run #3がcompleted successfullyであることを確認済み。v0.1.0 Releaseは[GitHub Release](https://github.com/kinoko34077/IDS-Composit/releases/tag/v0.1.0)で公開済み。hardening commit `bb5e5a6` はpush済みで、GitHub Actions CI Run #27とPages Run #5もcompleted successfully、公開入口のcandidate表記を含む現行Pagesを確認済み。Importer・Calibration corpus追加後のcommit `95fb6cf` は全33 test files / 188 tests、本体・tools typecheck、library/Pages build、package dry-runを通過し、同commitのCI Run #29とPages Run #7がcompleted/success、公開入口がHTTP 200であることをGitHub APIでも確認済み。直近の実データ生成ではBabelStone、Yi Bai lv0/lv1/lv2、CHISE+各SourceのUnified artifact、cross-source report、sampling corpusを固定hash付きで生成した。今回のC0〜C16では、Calibration専用source corpus、固定font manifest/hash、fontkit coverage、実Skia raster、Loss v1、optimizer、median profile、Sans/Serif gate、runtime profile、Pages三者比較までを追加した。⿰のcompact gate reportは`data/calibration/operator-u2ff0-v0.2.json`、runtime profileは`data/layout-profiles/v0.2.json`に保存している。C17最終Gate（2026-09-10）は全57 test files / 257 tests、runtime/tools typecheck、font hash verification、library build、Pages build、pack dry-run、artifact/package境界、git diff checkを通過した。library bundleは22.42 kB（gzip 6.75 kB）、PagesにはCalibration reportとFull Known assetを出力し、npm packageは16.7 kB / 45 filesでfont binary・bulk artifactを含まない。v0.2.0-dev.0はv0.2 RC候補として扱い、次はresolver pathの実測再確認、dogfooding、必要な追加operator測定のみとする。

## 残課題 / manual validation

- 縦書きでの構図保証と、固定比率の適否
- 複数fontにおける高密度glyphの判読性
- CHISE timeout/cache値の本番調整
- 初期font-family
- baseline補正値
- npm registry/CDNへの公開手順
- optional persistent cacheの必要性と仕様
- v0.2 Calibrationの追加operator測定（現時点でacceptedは⿰のみ。各operatorのsample不足・rejectはv0.1 fixed templateへfallback）
- v0.2 resolver pathの実測表示とCHISE live環境での再確認
- v0.2 RC後のdogfooding、Pages実機確認、npm registry/CDN公開判断

## 重要な再検討条件

以下が確認された場合のみ上位設計を再検討する。

- CHISE APIでは必要な文字同定が実用上困難
- CHISE利用条件が配布形態と衝突
- DOM/CSS合成が大半の対象で判読不能
- CHISEの現行IDS表現とParser方針が重大に衝突
