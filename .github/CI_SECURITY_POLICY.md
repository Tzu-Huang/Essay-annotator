# CI security policy

The stable required checks for `main` are:

- `Frontend quality gate`
- `Backend quality gate`
- `Security quality gate`

Required pull-request jobs run with read-only repository permissions and without production credentials. `OPENAI_API_KEY=test-only` and the runner-local SQLite URL in the backend job are synthetic isolation values, not secrets.

## Blocking policy

- Gitleaks blocks every unexcepted credential finding. CI comments and summaries are disabled to reduce accidental disclosure; logs must identify findings without reproducing complete credential values.
- The repository npm-audit wrapper blocks high and critical vulnerabilities, including development dependencies used by the production build toolchain, except exact unexpired advisory IDs in `.github/npm-audit-exceptions.json`.
- `pip-audit` blocks every unexcepted Python advisory because the tool does not provide a severity threshold.
- GitHub dependency review blocks newly introduced high and critical vulnerabilities on pull requests.

## Exceptions

An exception must be narrow and committed for review. It must record the advisory or Gitleaks fingerprint, affected package or path, owner, reason, follow-up Linear issue, and expiry date. Broad directory allowlists and permanent undocumented suppressions are prohibited.

The current React Router exception covers `GHSA-qwww-vcr4-c8h2` only. Upstream does not currently offer a non-breaking patched release, and npm's suggested forced downgrade is breaking. ZAC-87 owns reevaluation before the exception expires.

## Required GitHub settings

After the first workflow run registers the check names, protect `main` with a branch ruleset that:

1. Requires a pull request and one approval.
2. Requires the three stable checks above to pass.
3. Dismisses stale approvals and requires resolved conversations.
4. Blocks force pushes, branch deletion, and ordinary-contributor bypass.

Dependency review requires the repository dependency graph and supported GitHub security features. Confirm availability before making its check mandatory.
