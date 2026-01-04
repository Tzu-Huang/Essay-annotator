# Data Ingestion Notes

## Current Status
- Raw data is stored in Google Drive under the `raw_data` folder.
- The majority of essays are Google Docs (cloud-native documents), not physical `.docx` or `.txt` files.
- We have successfully:
  - Created a Google Cloud project.
  - Enabled Google Drive API.
  - Set up a Service Account with proper permissions.
  - Verified that our Python code can authenticate and access files within the designated `raw_data` folder in Google Drive.
- We have tested and confirmed that:
  - The API can list Google Docs files.
  - File IDs can be retrieved correctly.
- No essay text has been converted to local readable formats yet (`.txt` / `.json`).

## Known Issues
1. Google Docs are not physical files and cannot be read directly by Python without using the Google Drive API export functionality.
2. The `raw_data` directory contains a large number of unknown and inconsistently nested subfolders.
   - Folder depth is not fixed or predictable.
   - Essays may be located at arbitrary levels of nesting.
3. Not all Google Docs in `raw_data` are valid essays.
   - Some files are notes, drafts, requirements, or miscellaneous documents.
4. Attempting full automation on the current raw dataset would significantly increase code complexity and risk introducing hard-to-debug edge cases.

## Decisions
- Treat `raw_data/` in Google Drive as the canonical data source.
- Do NOT delete raw folders or files programmatically at this stage.
- Pause fully automated recursive export until data quality is improved.
- Perform manual data cleaning first:
  - Only retain essays that are considered "good essays."
  - A "good essay" is defined as an essay that successfully contributed to an acceptance from a university.
- Reduce data entropy before automation by normalizing folder structure and filtering out irrelevant documents.
- Adopt the principle: **clean data first, automate second**.

## Next Steps (Planned)
- Manually filter and curate the `raw_data` folder:
  - Remove or exclude non-essay documents.
  - Retain only accepted, high-quality essays.
  - Simplify excessively nested folder structures where possible.
- After manual filtering:
  - Use Google Drive API to export the remaining Google Docs essays into `.txt` files.
  - Apply file ID–based tracking to avoid duplicate exports.
- Convert the cleaned `.txt` files into structured `.json` format for downstream analysis and AI-based processing.
