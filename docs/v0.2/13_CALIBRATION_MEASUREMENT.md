# Calibration実測基盤

## 目的

v0.2のCalibrationは、既存Unicode文字のnative glyphとDOM/CSS compositionの差を、JP reference fontで測定し、IDC単位のGeneric Layout Profileへ集約する開発用pipelineである。ResolverのKnown Character Indexやruntime ontologyを拡張するものではない。

## 入力境界

```text
BabelStone direct-J / X
CHISE @apparent / functional
Yi Bai lv0 primary / alternative
        ↓ source adapter
CalibrationSourceRecord
        ↓ eligibility / ambiguity / primary selection
character SHA-256 split
        ↓ coverage gate
native + fixed composition raster
```

`known-index-v0.2.json`、Knownの`verified/candidate`、CHISE functional IDSはCalibrationの正本入力ではない。CHISE functionalはdiagnostic、CHISE `@apparent`は安全なUnicode IDSだけprimary候補である。全sourceの同一IDS→複数characterはtraining/alternateから除外しdiagnosticへ残す。

## Sampling

Calibration regionはv0.2.0ではJPのみ。1 characterにつきprimary training sampleは最大1件で、BabelStone direct-J、CHISE apparent、Yi Bai lv0 primaryの順に選ぶ。同rankはNFC-normalized IDSのlexical orderで決定し、canonical IDSとは呼ばない。alternateは別群として保持する。

partitionは配列順に依存しない。

```text
key = NFC(character)
digest = SHA-256(key)
bucket = first 32 bits mod 100
0..19 = holdout
20..99 = train
```

## 実測条件

- training: Source Han Sans JP 2.005R Regular static OTF
- cross-font: Source Han Serif JP 2.003R Regular static OTF
- canvas: 160×160px
- root em box: x=16, y=16, width=128, height=128
- font size: 128px
- baseline: font metricsから算出
- font binary: Git管理外、manifestの固定hashを検証して使用

fontkitでtargetとIDS全leafのglyph coverageを確認し、missing/tofuは教師から除外する。Skia Canvas backendとfontkitはtools専用dev dependencyで、runtime packageへ漏らさない。

## Evidenceと採用

lossはaxis occupancy、ink bounds、centroid、occupied area、raw alpha maskの5 sub-lossを保持する。root operatorのslotだけを±0.04、±0.02、±0.01でcoordinate descentし、nested childはv0.1固定templateを使う。operatorごとにtrain最大2,000 primary、train>=80かつholdout>=20の場合だけmedian profile候補を作る。

Sans JPでmedian改善/p75非悪化、Serif JPでmedian/p75非悪化を満たしたoperatorだけ`data/layout-profiles/v0.2.json`へ出力する。個別characterのraster/optimization evidenceはGitへ入れず、runtimeへも入れない。

実装済み範囲はC0〜C17である。C5〜C8で固定font manifest/hash、fontkit coverage、Skia raster、root em geometry、Loss v1を追加し、C9〜C12で実font sample、multi-resolution optimizer、stable cap、median profileを実装した。C13/C14では⿰のSans/Serif holdout Gateを実測し、C15でaccepted profileだけをruntimeへ統合、C16でPages三者比較を追加した。C17で全回帰・型検査・library/Pages build・pack境界を再確認した。数値と再現コマンドは[14_CALIBRATION_GATES.md](14_CALIBRATION_GATES.md)に記録する。
