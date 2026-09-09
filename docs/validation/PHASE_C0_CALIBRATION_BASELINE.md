# Phase C0 Calibration前ベースライン

実行日: 2026-09-09 (Asia/Tokyo)

## 固定対象

- repository: `kinoko34077/IDS-Composit`
- branch: `main`
- HEAD: `05c5eb44854829f504ff2b6c0bcaa9d0e8fbac96`
- package: `0.2.0-dev.0`
- v0.1 compatibility reference: `25e0449` / tag `v0.1.0`
- working tree: clean before this record

## Fresh gate

| command | result |
|---|---|
| `npm test -- --run` | 41 files / 217 tests passed |
| `npm run typecheck` | passed |
| `npm run typecheck:tools` | passed |
| `npm run build` | passed; `dist/ids-composit.js` 22.08 kB |
| `npm run build:pages` | passed; Full Known asset 12,932.05 kB |
| `npm run pack:check` | passed; package 16.3 kB / 44 files |
| `git diff --check` | clean at baseline capture |

## Calibration baseline limitation

The existing calibration foundation is intentionally still a prototype: its default measurement is a transparent 64x64 canvas with 64px `serif` text and a fixed 52px baseline, and the sample loss is only the provisional raw alpha-mask difference. Existing CHISE-derived and multi-source corpora remain preserved as historical/Resolver artifacts; they are not treated as the new Calibration source of truth. No real-font evidence, profile acceptance, or runtime profile integration is claimed by this baseline.
