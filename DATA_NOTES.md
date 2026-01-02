# Data Ingestion Notes

## Current Status
- Raw data is stored in Google Drive.
- Majority of essays are Google Docs (not actual .docx / .txt files).
- gdown can retrieve folder structure but cannot download Google Docs content.
- As a result, no readable text files exist locally under `data/raw`.

## Known Issues
1. Google Docs are not physical files and cannot be read directly by Python scripts.
2. gdown skips Google Docs silently when `remaining_ok=True` is enabled.
3. Local dataset currently contains folder structure only, without essay text.

## Decisions
- Do NOT delete any folders under `data/raw`.
- Treat `raw_data/` as the canonical data source.
- Pause JSON conversion until essays are exported into readable formats.

## Next Steps (Planned)
- Option A: Use Google Drive API to export Google Docs as `.txt`.
- Option B: Ask contributors to upload `.txt` versions.
- Option C: Manually export a small subset for prototyping.

