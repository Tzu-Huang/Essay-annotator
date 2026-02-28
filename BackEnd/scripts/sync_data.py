"""
sync_data.py

Purpose:
This script downloads the raw folder structure from Google Drive to the local
machine using `gdown`.

What this script does:
- Downloads the folder structure from a shared Google Drive folder.
- Attempts to download all accessible files.
- Skips files that cannot be downloaded (e.g., Google Docs) without crashing.

What this script does NOT do:
- It does NOT reliably download Google Docs content.
- It does NOT export Google Docs to readable text.
- It does NOT guarantee completeness of the dataset.
- It does NOT perform any data cleaning or filtering.

Important limitations:
- This code is NO LONGER used
- Please execute the updated program (export_docs_to_txt.py)

How to use:
1. Set DRIVE_FOLDER_URL to the shared Google Drive folder.
2. Run:
   python scripts/sync_data.py

Expected output:
- A local copy of accessible folder structures under `data/raw/`.
- Missing or skipped Google Docs files are expected behavior.
"""


# Please DO NOT use this code
from pathlib import Path
import gdown
import traceback

DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1RDLXJNR8Ol4uwmTE2yyym6mevdC84Xnr?usp=sharing"

OUT_DIR = Path("data/raw")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    print("Downloading raw data from Google Drive (skip failed files)...")

    try:
        gdown.download_folder(
            url=DRIVE_FOLDER_URL,
            output=str(OUT_DIR),
            quiet=False,
            use_cookies=False,
            remaining_ok=True   # allows error while downloading
        )
    except Exception as e:
        print("⚠️ Some files could not be downloaded. Skipping them.")
        print(str(e))
        print("Continuing...")

    print("Download step finished.")

if __name__ == "__main__":
    main()
