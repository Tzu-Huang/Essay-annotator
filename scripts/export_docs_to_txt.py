"""
export_docs_to_txt.py

Purpose:
This program export Google doc or word docx to txt file

What this script does:
1. Connects to Google Drive via a Service Account.
2. Scans folders under the designated `raw_curated` directory.
4. Exports each Google Doc or docx file as plain text (`.txt`).
5. Tracks exported files using Google Drive file IDs to avoid duplicates.

What this script does NOT do:
- It does not modify or delete files in Google Drive.
- It does not convert text into JSON.
- It does not perform any NLP or AI analysis.

How to use:
1. Set KEY_PATH to the local path of the Service Account JSON key.
2. Run:
   python scripts/export_docs_to_txt.py

Expected output:
- New `.txt` files created under `data/raw_text/`
- A state file (`data/processed/exported_ids.json`) recording processed file IDs

"""

import json
import re
from pathlib import Path
from datetime import datetime

from google.oauth2 import service_account
from googleapiclient.discovery import build

# ====== CONFIG ======
#TODO: change this to your own path
KEY_PATH = r"C:\Users\USER\Desktop\key\essay-project-key.json" #Zack's API key
RAW_FOLDER_ID = "1YZgNi_MTzNa1pgFpmexKXpw2ymN2gIVn" #Google drive folder id

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
# File Type. Current: Google Docs

DOC_MIME = "application/vnd.google-apps.document"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
ALLOWED_MIME_TYPE = {DOCX_MIME, DOC_MIME}

OUT_DIR = Path("data/organized_data")

STATE_DIR = Path("data/processed")
STATE_PREFIX = "exported_ids_part_"
STATE_GLOB = f"{STATE_PREFIX}*.json"

PAGE_SIZE = 100
#OUT_DIR = Path("data/organized_data")
#STATE_FILE = Path("data/processed/exported_ids.json")
# ====================


def sanitize_filename(name: str) -> str:
    # Keep letters/numbers/space/_/-
    safe = "".join(c for c in name if c.isalnum() or c in " _-").strip()
    # Avoid empty filenames
    return safe if safe else "untitled"


def state_file_for_batch(batch_idx: int) -> Path:
    return STATE_DIR / f"{STATE_PREFIX}{batch_idx:03d}.json"


def load_all_processed_ids() -> set[str]:
    """
    Load all processed file IDs from existing state part files.
    Returns:
        set of file_ids already processed.
    """
    processed = set()
    if not STATE_DIR.exists():
        return processed

    for p in sorted(STATE_DIR.glob(STATE_GLOB)):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                processed.update(data.keys())
        except Exception:
            # If a state file is corrupted, skip it (but you might want to inspect it)
            continue
    return processed


def next_batch_index() -> int:
    """
    Find the next available batch index based on existing part files.
    """
    if not STATE_DIR.exists():
        return 1
    max_idx = 0
    pattern = re.compile(rf"^{re.escape(STATE_PREFIX)}(\d+)\.json$")
    for p in STATE_DIR.glob(STATE_GLOB):
        m = pattern.match(p.name)
        if m:
            try:
                max_idx = max(max_idx, int(m.group(1)))
            except ValueError:
                pass
    return max_idx + 1


def export_google_doc_to_text(service, file_id: str) -> str:
    request = service.files().export(fileId=file_id, mimeType="text/plain")
    return request.execute().decode("utf-8")


def export_docx_to_text(service, file_id: str) -> str:
    request = service.files().get_media(fileId=file_id)
    docx_bytes = request.execute()

    from io import BytesIO
    import docx
    doc = docx.Document(BytesIO(docx_bytes))
    return "\n".join(p.text for p in doc.paragraphs)


def main():
    creds = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
    service = build("drive", "v3", credentials=creds)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    processed_ids = load_all_processed_ids()
    batch_idx = next_batch_index()

    print("\nScanning...")

    page_token = None
    total_seen = 0
    total_exported = 0
    total_skipped_unupported = 0
    total_skipped_processed = 0
    pages_processed = 0

    while True:
        results = service.files().list(
            q=f"'{RAW_FOLDER_ID}' in parents and trashed = false",
            fields="nextPageToken, files(id, name, mimeType)",
            pageSize=PAGE_SIZE,
            pageToken=page_token
        ).execute()

        files = results.get("files", [])
        page_token = results.get("nextPageToken")

        if not files:
            if pages_processed == 0:
                print("No files found")
            break

        pages_processed += 1
        total_seen += len(files)

        # NEW: state per page (100)
        current_batch_state = {}

        print(f"\n--- Page {pages_processed} (up to {PAGE_SIZE} files) ---")

        for f in files:
            file_id = f.get("id")
            name = f.get("name", "untitled")
            mime = f.get("mimeType", "")

            # Skip already processed
            if file_id in processed_ids:
                total_skipped_processed += 1
                continue

            if mime not in ALLOWED_MIME_TYPE:
                total_skipped_unupported += 1
                # still record? usually no. We'll not record unsupported.
                continue

            print(f" Exporting: {name}")

            try:
                if mime == DOC_MIME:
                    content = export_google_doc_to_text(service, file_id)
                else:  # DOCX_MIME
                    content = export_docx_to_text(service, file_id)
            except Exception as e:
                # If export fails, don't mark as processed; just show error and continue
                print(f"  [ERROR] Failed to export {name}: {e}")
                continue

            safe_name = sanitize_filename(name)
            out_path = OUT_DIR / f"{safe_name}.txt"
            out_path.write_text(content, encoding="utf-8")

            current_batch_state[file_id] = {
                "name": name,
                "source_folder": "raw_curated",
                "mimeType": mime,
                "exported_at": datetime.utcnow().isoformat(),
                "output": str(out_path)
            }

            processed_ids.add(file_id)
            total_exported += 1

        # Save this page's state as its own json file
        state_path = state_file_for_batch(batch_idx)
        state_path.write_text(
            json.dumps(current_batch_state, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )

        print(f"Saved state: {state_path} (records: {len(current_batch_state)})")
        batch_idx += 1

        # If no more pages, stop
        if not page_token:
            break

    print("\n===== Summary =====")
    print(f"Pages processed: {pages_processed}")
    print(f"Total files seen (listed): {total_seen}")
    print(f"Exported (new): {total_exported}")
    print(f"Skipped (already processed): {total_skipped_processed}")
    print(f"Skipped (unsupported mimeType): {total_skipped_unupported}")
    print(f"TXT output dir: {OUT_DIR}")
    print(f"State dir: {STATE_DIR}")


if __name__ == "__main__":
    main()