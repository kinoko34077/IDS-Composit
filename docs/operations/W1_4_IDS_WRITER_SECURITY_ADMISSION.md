# W1.4 IDS-only privileged writer admission (draft; no effectful authority)

Owner: https://github.com/kinoko34077/IDS-Composit/issues/11
Crossrepo checkpoint: https://github.com/kinoko34077/devflow/issues/487
Fleet prohibition: https://github.com/kinoko34077/devflow/issues/386

## User direction (2026-10-19)
The owner conditionally permitted proceeding with IDS-only writeback where it causes no problems. This is **not** authorization to waive security controls, change secrets or branch protection, write directly to main, publish Pages, or enable fleet-wide writes.

## Fixed scope
- Recipe: `ids-known-merge-v0.2` only.
- Outputs: `data/known/generated/known-index-v0.2.json` and `data/known/reports/known-index-v0.2.json` only.
- Limits: 24 MiB per file and 32 MiB combined.
- Branch prefix: `artifact/writeback-ids/`; PR-only; protected main must never be directly written.
- Keep `COMMITTED -> same receipt NO_OP_REPLAY`, stale HEAD refusal, fresh readback, and forward-only rollback.

## Admission checklist (fail closed)
- [ ] Verify actual branch protection and reviewer policy through authoritative evidence; previous detailed protection API returned HTTP 403. An empty ruleset listing is not proof of no protections.
- [ ] Identify exact write credential issuer, token audience, scoped repository and minimal job permissions; no general-purpose secret or new broad grant.
- [ ] Independent security reviewer validates caller-to-writer trust, immutable SHA pin, exact recipe/path/size allowlist, target branch/HEAD checks, race and replay safety, and rollback.
- [ ] Prove the restricted implementation on an isolated PR branch with native CI and readback before any effectful IDS run.
- [ ] Record explicit target-specific Human admission and reviewer evidence in owner #11; do not infer it from R4 Pages approval or testapp R3.
- [ ] Execute at most one guarded IDS writeback and verify resulting receipt, PR diff and CI. No automatic main merge or Pages publication.

## Current state
IDS main `e97c073cdd8e17dca6b205a45751694a46ec90c1` remains read-only; workflow only accepts `dry-run`, job `contents:read`. Shared IDS writer is dormant (`WRITE_ACTIVATED = False`). This document is an admission checklist, not a writer implementation or authorization to dispatch.
