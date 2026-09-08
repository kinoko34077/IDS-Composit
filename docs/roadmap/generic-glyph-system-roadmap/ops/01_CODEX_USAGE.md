# Codex Usage / Token節約運用

## 原則
毎回全資料を渡さない。

## Phase 0開発時
最初に渡す:
1. `00_INDEX.md`
2. `01_PROJECT_SCOPE.md`
3. `02_ARCHITECTURE_SUMMARY.md`
4. 現在Stageの `README.md`
5. 現在作業に必要な枝葉1〜3枚

## 例: Parser実装
読む:
- `00_INDEX.md`
- `02_ARCHITECTURE_SUMMARY.md`
- `stages/stage01/README.md`
- `stages/stage01/01_GRAMMAR.md`
- `stages/stage01/02_AST.md`
- `stages/stage01/04_TESTS.md`

Registry資料は読ませない。

## 作業指示テンプレート
```text
この作業ではINDEXとStage XX資料を正本とする。
未確定事項を勝手に確定しない。
他Stageの将来機能を先回り実装しない。
完了後、Stage Gateを検証し、満たした項目だけ報告する。
```
