---
reviewer: codex
mode: initial
round: 1
branch: feature/ZAC-66_migrate-essay-annotator-repo
base: main
reviewed_head: 017ea31944e4c63a73b26540c7ab949d2ff9541e
previous_review: null
previous_reviewed_head: null
verdict: changes-requested
---

# Codex Review

The configured release base is `main`; this local checkout has no local
`main` ref, so the review compared `origin/main...HEAD`. `origin/main`,
`frontend-base`, and the migration baseline resolve to the same commit
`dff98aa`.

## Finding transitions

None. This is the initial review round.

## New blocking findings

### [P1][REV-001] Tracked deployment archive contains credentials

- **Evidence:** `_aws_delivery/README.md:17-19` documents that
  `essay-annotator-secrets-20260715.tar.gz` contains `BackEnd/.env`,
  `frontend/.env`, `BackEnd/client_secret.json`, and `BackEnd/token.json`.
  `git ls-files` confirms the archive is tracked in `HEAD`, `frontend-base`,
  and `origin/main`; its SHA256 archive is present in the repository as well.
- **Impact:** A non-ignored, committed tarball contains private credentials and
  tokens, directly violating the migration requirement that secrets not be
  staged, committed, or pushed. The archive is also part of the GitHub-linked
  repository history, so local cleanup does not remediate exposure.
- **Classification:** `late-blocker` (pre-existing high-confidence security
  defect).
- **Required resolution:** Remove the archive from tracked repository content
  and remediate its Git history as appropriate; rotate every credential it
  contains before treating the repository as safe. Preserve any replacement
  only in an approved local secret store or separately controlled deployment
  channel.

### [P2][REV-002] AWS transfer command points to a missing SSH key path

- **Evidence:** `_aws_delivery/README.md:36-43` says to run from
  `C:\Personal_repo\Projects\essay-annotator` but invokes
  `scp -i .\Fb021451.pem`. The same README at line 32 and
  `_aws_delivery/excluded-files.txt:16-17` state that the key remains outside
  the repository at `C:\aws\Fb021451.pem`.
- **Impact:** Following the migration-updated deployment instructions from the
  target root fails before transfer because `.\Fb021451.pem` is not the
  documented key location. This leaves the validated promotion/deployment path
  non-functional.
- **Classification:** `fix-introduced`.
- **Required resolution:** Use the documented external key path in the command
  or provide an explicit secure key-placement step that does not add the key to
  the repository.

### [P2][REV-003] Validation evidence omits 12 manifest exceptions

- **Evidence:** `validation-evidence.md:13` states that source and target
  manifests had zero differences. Re-reading the preserved CSVs produced
  `source_rows=19302`, `target_rows=19290`, with 12 source-only paths and no
  target-only paths. The 12 paths are the unrelated
  `add-developer-admin-console` OpenSpec artifacts and four `.codex` skill
  files; shared file lengths matched.
- **Impact:** The acceptance requirement says intentional preservation
  exceptions must be explicitly recorded. The current evidence is factually
  incomplete and does not distinguish required runtime/data parity from the
  intentionally omitted ProjectVault workflow artifacts.
- **Classification:** `fix-introduced`.
- **Required resolution:** Update the evidence with the exact intentional
  source-only paths and state that zero differences apply to the required
  preservation set, or regenerate the manifests using an explicitly documented
  exclusion set.

## Follow-up findings

None.

## Verification and residual risk

- Backend unittest discovery: 18 tests passed.
- Frontend lint: passed.
- Frontend tests: 12 passed.
- Frontend production build: passed; Vite transformed 1,826 modules.
- The target working tree was clean at review start.
- No startup, test, or build failures were observed in this review.
- The tracked credential archive remains an unresolved security risk until
  credential rotation and repository-history remediation are completed.

## Next Action

`/dev-fix --review "openspec/changes/migrate-essay-annotator-repo/review/2026-07-20_feature-ZAC-66_migrate-essay-annotator-repo_codex-review-r1.md"`

Reason: blocking findings `REV-001`, `REV-002`, and `REV-003` remain.
