# Input: Google Drive folder (DRIVE_FOLDER_ID) that contains Google Docs / .docx files
# Output: Exported .txt files stored under the app's new_input folder

import json
import os
import re
from io import BytesIO
from pathlib import Path

import docx
from dotenv import load_dotenv
from add_to_database import move_processed_file
from sync_drive import ensure_folder_access, get_drive_service

# =========================
# Config
# =========================

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent

load_dotenv()

DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID", "")

# File Type. Current: Google Docs + DOCX
DOC_MIME = "application/vnd.google-apps.document"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
ALLOWED_MIME_TYPE = {DOCX_MIME, DOC_MIME}
NEW_DOCS_DIR = BACKEND_DIR / "drive_data/new_input"
OUT_DIR = BACKEND_DIR / "drive_data/organized_data/new_input"
STATE_DIR = BACKEND_DIR / "drive_data/organized_data/export_state"
STATE_PREFIX = "exported_ids_part_"
STATE_GLOB = f"{STATE_PREFIX}*.json"

PAGE_SIZE = 100


# =========================
# Helper functions
# =========================
def sanitize_filename(name: str) -> str:
    """
    Keep only letters, numbers, spaces, '_' and '-',
    and ensure the filename is not empty.
    """
    safe = "".join(c for c in name if c.isalnum() or c in " _-").strip()
    return safe if safe else "untitled"


def state_file_for_batch(batch_idx: int) -> Path:
    return STATE_DIR / f"{STATE_PREFIX}{batch_idx:03d}.json"


def load_all_processed_ids() -> set[str]:
    processed = set()
    if not STATE_DIR.exists():
        return processed

    for path in sorted(STATE_DIR.glob(STATE_GLOB)):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                processed.update(data.keys())
        except Exception:
            continue

    return processed


def next_batch_index() -> int:
    if not STATE_DIR.exists():
        return 1

    max_idx = 0
    pattern = re.compile(rf"^{re.escape(STATE_PREFIX)}(\d+)\.json$")
    for path in STATE_DIR.glob(STATE_GLOB):
        match = pattern.match(path.name)
        if match:
            try:
                max_idx = max(max_idx, int(match.group(1)))
            except ValueError:
                pass

    return max_idx + 1


def export_google_doc_to_text(service, file_id: str) -> str:
    request = service.files().export(fileId=file_id, mimeType="text/plain")
    return request.execute().decode("utf-8")


def export_docx_to_text(service, file_id: str) -> str:
    request = service.files().get_media(fileId=file_id)
    docx_bytes = request.execute()
    document = docx.Document(BytesIO(docx_bytes))
    return "\n".join(p.text for p in document.paragraphs)


# =========================
# Main logic
# =========================
def export_new_docs(FOLDER_ID):
    if not FOLDER_ID:
        raise ValueError("DRIVE_FOLDER_ID is empty.")

    service = get_drive_service()
    folder = ensure_folder_access(service, DRIVE_FOLDER_ID, "Export source folder")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    processed_ids = load_all_processed_ids()
    batch_idx = next_batch_index()

    new_essays = []

    print(f"\nScanning folder: {folder['name']}")

    page_token = None
    total_seen = 0
    total_exported = 0
    total_skipped_unsupported = 0
    total_skipped_processed = 0
    pages_processed = 0

    while True:
        results = service.files().list(
            q=f"'{DRIVE_FOLDER_ID}' in parents and trashed=false",
            fields="nextPageToken, files(id, name, mimeType)",
            pageSize=PAGE_SIZE,
            pageToken=page_token,
        ).execute()

        files = results.get("files", [])
        page_token = results.get("nextPageToken")

        if not files:
            if pages_processed == 0:
                print("No files found")
            break

        pages_processed += 1
        total_seen += len(files)
        current_batch_state = {}

        print(f"\n--- Page {pages_processed} (up to {PAGE_SIZE} files) ---")

        for file_info in files:
            file_id = file_info.get("id")
            name = file_info.get("name", "untitled")
            mime = file_info.get("mimeType", "")

            if file_id in processed_ids:
                total_skipped_processed += 1
                continue

            if mime not in ALLOWED_MIME_TYPE:
                total_skipped_unsupported += 1
                continue

            print(f" Exporting: {name}")

            try:
                if mime == DOC_MIME:
                    content = export_google_doc_to_text(service, file_id)
                else:
                    content = export_docx_to_text(service, file_id)
            except Exception as exc:
                print(f"  [ERROR] Failed to export {name}: {exc}")
                continue

            safe_name = sanitize_filename(name)
            out_path = OUT_DIR / f"{safe_name}.txt"
            out_path.write_text(content, encoding="utf-8")

            new_essays.append(
                {
                    "file_id": file_id,
                    "name": name,
                    "content": content,
                    "source": "drive",
                }
            )

            current_batch_state[file_id] = {
                "name": name,
                "output": str(out_path),
            }

            processed_ids.add(file_id)
            total_exported += 1

            move_processed_file(NEW_DOCS_DIR)

        state_path = state_file_for_batch(batch_idx)
        state_path.write_text(
            json.dumps(current_batch_state, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        print(f"Saved state: {state_path} (records: {len(current_batch_state)})")
        batch_idx += 1

        if not page_token:
            break

    print("\n===== Summary =====")
    print(f"Pages processed: {pages_processed}")
    print(f"Total files seen (listed): {total_seen}")
    print(f"Exported (new): {total_exported}")
    print(f"Skipped (already processed): {total_skipped_processed}")
    print(f"Skipped (unsupported mimeType): {total_skipped_unsupported}")
    print(f"TXT output dir: {OUT_DIR}")
    print(f"State dir: {STATE_DIR}")

    return new_essays


if __name__ == "__main__":
    export_new_docs(DRIVE_FOLDER_ID)
