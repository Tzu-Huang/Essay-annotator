# ZAC-87 CI evidence

Record GitHub-hosted evidence here during `/dev-test`. Do not paste credentials or full scanner matches.

| Scenario | Commit SHA | Check/run URL | Expected result | Observed result |
|---|---|---|---|---|
| Healthy pull request | `2f822307618f1c04b9f024513ce2bd9279532452` | [PR #9 / run 30981245684](https://github.com/Tzu-Huang/Essay-annotator/actions/runs/30981245684) | All three required checks pass without production secrets | Frontend, backend, and security gates passed on a PR targeting `main`; backend used only the workflow's synthetic OpenAI key and isolated SQLite URL. |
| Deliberately broken frontend | `b8f6af94b1c4060215c8fe7d791c9e14a0affc5b` | [Frontend job](https://github.com/Tzu-Huang/Essay-annotator/actions/runs/30981562520/job/92226900489) | Frontend quality gate fails with a useful diagnostic | Failed on `deliberate ZAC-87 frontend failure proof` with the test path and assertion visible. |
| Deliberately broken backend | `b8f6af94b1c4060215c8fe7d791c9e14a0affc5b` | [Backend job](https://github.com/Tzu-Huang/Essay-annotator/actions/runs/30981562520/job/92226900474) | Backend quality gate fails with a useful diagnostic | Failed on `test_backend_quality_gate_rejects_broken_candidate` with the assertion visible. |
| Synthetic credential fixture | `b8f6af94b1c4060215c8fe7d791c9e14a0affc5b` | [Security job](https://github.com/Tzu-Huang/Essay-annotator/actions/runs/30981562520/job/92226900393) | Security quality gate fails and redacts the value | Gitleaks failed on `aws-access-token`; both Finding and Secret were printed as `REDACTED`, not the complete synthetic value. |
| Blocking dependency finding | `fd4dc58d688285bbb879ecda18ca9b65d62b5d4e` | [Security job](https://github.com/Tzu-Huang/Essay-annotator/actions/runs/30981827039/job/92227690052) | Security quality gate rejects an unexcepted high-severity advisory | Frontend and backend gates passed; security failed in the npm audit step on `GHSA-qwww-vcr4-c8h2 (high)`. |
| Protected merge attempt | `b8f6af94b1c4060215c8fe7d791c9e14a0affc5b` | [PR #10](https://github.com/Tzu-Huang/Essay-annotator/pull/10) | Merge is blocked while a required check fails | GitHub reported `mergeable: MERGEABLE` but `mergeStateStatus: BLOCKED` while all three required checks failed. |

## Branch-protection verification

- Ruleset URL or settings screenshot: [repository branch settings](https://github.com/Tzu-Huang/Essay-annotator/settings/branches)
- Required check names match workflow job names: `Frontend quality gate`, `Backend quality gate`, and `Security quality gate`; strict status checks are enabled.
- Pull request, approval, stale-review, conversation, force-push, deletion, and bypass settings verified: pull requests and one approving review required; stale reviews dismissed; conversation resolution required; force pushes and deletion disabled; protection enforced for administrators.

## Temporary proof pull requests

- [PR #10](https://github.com/Tzu-Huang/Essay-annotator/pull/10) contains deliberate frontend, backend, and credential failures and must never be merged.
- [PR #11](https://github.com/Tzu-Huang/Essay-annotator/pull/11) contains the deliberate dependency-policy failure and must never be merged.
