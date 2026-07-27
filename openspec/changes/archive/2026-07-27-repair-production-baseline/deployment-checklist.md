# ZAC-83 Data-Safe Deployment Checklist

This checklist prepares a later deployment; it does not authorize or perform one.

## Before deployment

- [ ] Confirm the approved and tested source SHA and its merged `main` SHA.
- [ ] Confirm the production checkout path, current SHA, branch, remote, and clean/dirty state.
- [ ] Record the code rollback target and preserve the current service/unit configuration.
- [ ] Inventory PostgreSQL configuration category, `BackEnd/drive_data`, uploads/import state, embeddings, JSONL sources, and other host-only runtime files without recording secret values.
- [ ] Create or verify a current recoverable backup of persistent data; do not rely only on the dated 2026-07-15 archive.
- [ ] Verify backup integrity by existence, size, and checksum or a suitable database restore check.
- [ ] Confirm required runtime environment-variable names are present without printing their values.
- [ ] Confirm the frontend artifact was built from the exact approved SHA.

## Deployment

- [ ] Deploy only the exact selected commit from `main`.
- [ ] Preserve ignored host files and persistent-data paths; do not use cleanup commands that target them.
- [ ] Install backend dependencies in the production virtual environment using the committed requirements.
- [ ] Install or copy the verified frontend production build through the separately selected serving design.
- [ ] Restart only the intended application service after files and dependencies are ready.

## Readiness

- [ ] Confirm the systemd service is active and no restart loop is present.
- [ ] Confirm backend liveness and readiness endpoints.
- [ ] Confirm public essay search/detail/compare behavior against non-destructive inputs.
- [ ] Confirm authorized admin read behavior and one explicitly approved non-destructive admin workflow.
- [ ] Confirm expected listeners and inspect service logs for import, database, embedding, or credential errors.

## Rollback

- [ ] Stop the failed application process without deleting runtime data.
- [ ] Restore the recorded code/service state.
- [ ] Restore persistent data only when a data migration actually occurred and the verified restore procedure requires it.
- [ ] Restart and verify the rollback state.
- [ ] Record deployment and rollback evidence without secrets.
