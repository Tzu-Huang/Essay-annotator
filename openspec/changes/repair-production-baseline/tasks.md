## 1. Baseline and Scope Evidence

- [x] 1.1 Record the branch base, broken merge commit and parents, current production SHA, candidate release paths, and launch-v1 behavior inventory
- [x] 1.2 Classify tracked dependencies, build output, delivery archives, graph output, runtime files, and persistent production data with an explicit keep/remove/preserve disposition
- [x] 1.3 Record the persistent-data locations, available backup evidence, rollback SHA, and known deployment constraints without exposing secrets

## 2. Backend Merge Repair

- [x] 2.1 Reconcile conflict markers in backend dependency declarations and application modules against both merge parents
- [x] 2.2 Reconcile conflict markers in database, embedding, ingestion, extraction, and import/synchronization scripts while preserving launch-v1 behavior
- [x] 2.3 Reconcile and extend backend tests to cover the selected admin, state, file-extraction, ingestion, and embedding behavior
- [x] 2.4 Run an automated tracked-file scan and confirm no unresolved merge-conflict markers remain

## 3. Frontend Baseline Reconciliation

- [x] 3.1 Reconcile the admin console and related frontend behavior with the documented launch-v1 scope
- [x] 3.2 Restore or add targeted frontend tests for the selected admin-console behavior and explicitly record any deferred behavior
- [x] 3.3 Verify frontend dependency manifests and lockfile contain every dependency required by the release build

## 4. Repository Hygiene and Data Safety

- [x] 4.1 Remove tracked root dependencies, generated build/cache files, graph-analysis output, and other reproducible artifacts from release scope
- [x] 4.2 Remove binary delivery archives from Git while retaining only justified secret-safe operational documentation or manifests
- [x] 4.3 Update precise ignore rules for dependencies, generated output, archives, credentials, runtime databases, datasets, embeddings, uploads, and logs
- [x] 4.4 Verify required local and production data remains outside Git or in documented backup locations and that no cleanup step targets live host data
- [x] 4.5 Scan staged and tracked release content for credentials, private keys, tokens, passwords, and accidental runtime data

## 5. Clean Verification

- [ ] 5.1 From a clean frontend dependency state, install from the lockfile and pass lint, automated tests, and the production build
- [ ] 5.2 From a clean Python environment, install backend dependencies and pass the complete backend test suite
- [ ] 5.3 Pass backend application import and bounded startup/readiness checks without production credentials or persistent-data mutation
- [ ] 5.4 Record all verification commands, results, tested source SHA, launch-v1 limitations, and rollback SHA

## 6. Release Baseline Handoff

- [ ] 6.1 Complete code review and address all blocking findings against the tested candidate commit
- [ ] 6.2 Merge the approved change through a pull request to `main` without deploying or modifying production
- [ ] 6.3 Record the merged `main` baseline SHA and link its verification evidence for the parent launch issue
- [ ] 6.4 Prepare the separately authorized deployment checklist with backup, readiness, and data-preserving rollback gates
