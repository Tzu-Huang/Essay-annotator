---
reviewer: codex
mode: initial
round: 1
branch: feature/ZAC-87_add-ci-quality-gates
base: main
reviewed_head: 18baec987603ad51d8efc40c04ec445c31e3e846
previous_review: null
previous_reviewed_head: null
verdict: changes-requested
---

# Codex Review

## Finding transitions

| ID | Priority | Status | Evidence |
|---|---|---|---|
| REV-001 | P2 | open | The committed policy requires one approval, while the applied and recorded protection requires zero. |
| REV-002 | P2 | open | Backend CI installs the unpinned `BackEnd/requirements.txt`; no backend lock or constraints file exists. |

## New blocking findings

### [P2][REV-001] Applied branch protection does not enforce the committed approval policy

`.github/CI_SECURITY_POLICY.md:26-31` defines the required `main` policy and explicitly requires a pull request with one approval plus stale-approval dismissal. The applied GitHub protection reports `required_approving_review_count: 0`, and `.github/ci-evidence/ZAC-87.md:18` records zero approvals as the completed state. This permits the PR author to merge after checks without the review required by the repository's own agreed policy, so the ZAC-87 acceptance criterion that direct merge is prevented "according to the agreed policy" is not met.

Classification: explicit acceptance-criterion violation introduced by this change, so P2 blocks approval.

Required resolution: configure `main` to require one approval, retain stale-review dismissal, verify the setting through GitHub, and update the committed evidence to match the applied policy. If a zero-approval policy is actually intended for this single-maintainer repository, that changes the accepted policy and requires explicit scope/requirements agreement rather than silently contradicting the committed document.

### [P2][REV-002] Backend clean installation is not reproducible from a lockfile

ZAC-87 explicitly requires clean dependency installation with lockfiles. `.github/workflows/ci.yml:70-73` installs `BackEnd/requirements.txt`, whose entries at `BackEnd/requirements.txt:1-17` have no versions, hashes, or constraints. Repository inspection found no backend lock, constraints, `pyproject.toml`, Pipfile, Poetry lock, or uv lock. The same commit can therefore resolve different FastAPI, SQLAlchemy, OpenAI, and other dependency versions on later runs, and `.github/workflows/ci.yml:116-119` audits that floating resolution rather than the exact environment validated by the backend gate.

Classification: explicit ZAC-87 work/acceptance boundary violation introduced by this CI implementation, so P2 blocks approval.

Required resolution: add a committed deterministic backend dependency lock/constraints artifact appropriate to the repository, make both backend installation and `pip-audit` consume it, and add a focused check proving CI uses the locked artifact.

## Follow-up findings

- P3: Hosted logs warn that the pinned checkout and Gitleaks actions target deprecated Node.js 20 and are currently forced onto Node.js 24. Track upgrades to supported immutable action commits before GitHub removes the compatibility path; this does not block the current verified run.

## Verification and residual risk

- Reviewed `git diff main...18baec987603ad51d8efc40c04ec445c31e3e846`, all changed workflow/security/OpenSpec files, the linked ZAC-87 requirements, branch-protection API evidence, and the healthy/failure-proof runs.
- Verification Round 5 passed at the reviewed head, including local frontend/backend/security checks and hosted PR #9. Passing checks demonstrate execution, but do not resolve the two policy/reproducibility mismatches above.
- The temporary npm exception expires on 2026-08-17 and remains an operational follow-up owned by ZAC-87.

## Next Action

`/dev-fix --review "openspec/changes/add-ci-quality-gates/review/2026-08-05_feature-ZAC-87_add-ci-quality-gates_codex-review-r1.md"`

Reason: blocking findings REV-001 and REV-002 remain.
