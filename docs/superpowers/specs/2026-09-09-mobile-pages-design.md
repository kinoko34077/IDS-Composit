# Mobile GitHub Pages Verification Surface

## Goal

GitHub Pages上で、スマートフォンからIDS-Compositの現行挙動を確認できる入口と実機検証用UIを提供する。

## Scope

- `examples/index.html`をPages入口として追加する。
- IDSソースを直接入力して表示できる。
- 既定の候補をselectから選択し、入力欄へ反映できる。
- 対応IDC、variant、nested、trinary、密度差を一覧表で一括確認できる。
- local compositionとCHISE native優先を切り替えられる。
- 既存のbasic、validation、chise-preflight、consumerへ相対リンクで移動できる。
- Pages専用のVite buildとGitHub Actions deploy workflowを追加する。

## Non-goals

- 公開libraryのAPI、IDS syntax、AST、Layout Model、CHISE Adapterの変更
- Pagesをnpm/CDNの本番配布先として扱うこと
- 別hosting（Cloudflare Pages等）の追加
- 独自のIDSデータベース、候補検索サービス、アカウント機能

## Architecture

`examples/index.ts`が候補カタログと入力UIを管理し、表示対象へ公開APIの`renderIds`を呼び出す。入力値は前後空白を除き、`⟦...⟧`が無い場合だけ表示用に付与する。アプリケーション自身はIDSを解析せず、構文判定とfallbackは既存libraryへ委譲する。

`vite.pages.config.ts`は`root: 'examples'`、`base: '/IDS-Composit/'`、出力先`pages-dist/`のmulti-page buildとする。library buildを先に実行し、consumer demoが現在のpackage exportを検証できる状態でPages buildへ渡す。既存`vite.lib.config.ts`と`.github/workflows/ci.yml`は変更しない。

`pages.yml`はmain pushと手動実行で起動し、checkout、Node setup、依存インストール、library build、Pages build、Pages artifact upload、deployを順に実行する。deploy権限はPagesに必要な`pages: write`と`id-token: write`だけに限定する。

## Mobile UI requirements

- viewport metaを設定し、片手操作を想定した縦積みの入力・select・buttonを使う。
- 入力欄、候補select、表示ボタン、CHISE checkbox、結果ステータスをlabel付きで提供する。
- 結果一覧は狭い画面で横スクロールでき、IDS sourceとrendered previewを同じ行で比較できる。
- native解決やCHISE failureの結果をステータスへ表示し、ページ全体の表示失敗にはしない。
- 外部入力を`innerHTML`へ挿入せず、テキストとDOM APIで表示する。

## Verification

- 既存全テスト、typecheck、library build、pack checkを通す。
- `npm run build:pages`でPages outputに入口と4既存ページが生成されることを確認する。
- Pages outputをローカルHTTP serverで開き、入力、候補選択、一覧表、各リンク、CHISE toggleを実ブラウザで確認する。
- `base`配下の相対リンクとscript/style assetがGitHub Pagesの`/IDS-Composit/`配下で解決することを確認する。
- READMEへPages URL、確認ページURL、Repository Settingsで一度だけ行うPages source設定を追記する。

## Acceptance criteria

1. `https://kinoko34077.github.io/IDS-Composit/`相当のPages outputで入口が開く。
2. 入力欄へ`⿰木可`または`⟦⿰木可⟧`を入れて表示できる。
3. 候補選択で`⿰`、`⿱`、`⿴`、`⿲`、`⿳`、variant、nested、密度差を試せる。
4. 一覧表で各候補のsourceとrendered resultを比較できる。
5. 既存4ページへ移動でき、libraryの既存回帰がない。
6. main push時のPages workflowが成功する。
