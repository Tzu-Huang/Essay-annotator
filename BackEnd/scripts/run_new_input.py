"""
Thin pipeline runner for new essay input.

This file is meant to stay small and mostly call functions that already
exist in the other scripts.
"""

from pathlib import Path
import os
import sys
from dotenv import load_dotenv
from googleapiclient.http import MediaFileUpload
from add_to_database import update_database
from add_to_database import PROCESSED_INPUT_DIR
from export_docs_to_txt import NEW_DOCS_DIR
from export_docs_to_txt import export_new_docs
from sync_drive import run_sync, ensure_folder_access, get_drive_service

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from embedding.make_embedding import update_embeddings


SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
DATABASE_JSONL = BACKEND_DIR / "drive_data/finalized_data_jsonl/database.jsonl"
EMBED_JSONL = BACKEND_DIR / "drive_data/embed_output/embed.jsonl"

load_dotenv()
DRIVE_FOLDER_ID = os.getenv("DRIVE_FOLDER_ID", "")
PROCESSED_DOCS_FOLDER_ID = os.getenv("PROCESSED_DOCS_FOLDER_ID", "")
PROCESSED_TXT_FOLDER_ID = os.getenv("PROCESSED_TXT_FOLDER_ID", "")
DATABASE_FOLDER_ID = os.getenv("DATABASE_FOLDER_ID", "")
EMBED_FOLDER_ID = os.getenv("EMBED_FOLDER_ID", "")

# helper function to get the file type
def get_mimetype(path: Path) -> str:
    suffix = path.suffix.lower()

    if suffix == ".txt":
        return "text/plain"
    elif suffix in [".json", ".jsonl"]:
        return "application/json"
    elif suffix == ".png":
        return "image/png"
    elif suffix in [".jpg", ".jpeg"]:
        return "image/jpeg"
    elif suffix == ".pdf":
        return "application/pdf"
    else:
        return "application/octet-stream"


# save the existing files into a dictionary to check
def get_existing_files(service, folder_id: str) -> dict[str, str]:
    response = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false",
        fields="files(id,name)",
        pageSize=1000,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()

    return {f["name"]: f["id"] for f in response.get("files", [])}

# general function uploading files to google drive
# use different modes to handle
# if general txt/docs -> skip if see existing file names
# if jsonl -> update/overwrite it
def upload_to_drive(file_paths: list[Path], folder_id: str, label: str, mode: str = "update") -> None:

    SKIP = "skip_if_exists"
    UPDATE = "update"

    if not folder_id:
        print(f"Skipping upload: {label} folder ID is empty or invalid.")
        return

    existing_paths = [Path(path) for path in file_paths if Path(path).exists() and Path(path).is_file()]
    missing_paths = [str(path) for path in file_paths if not Path(path).exists()]

    if missing_paths:
        print(f"Skipping {len(missing_paths)} missing file(s).")

    if not existing_paths:
        print("Skipping upload: no valid files were provided.")
        return
    
    service = get_drive_service()
    folder = ensure_folder_access(service, folder_id, f"{label} folder")
    existing_files = get_existing_files(service, folder_id)

    uploaded_count = 0
    updated_count = 0

    for path in existing_paths:
        try:
            media = MediaFileUpload(str(path), mimetype=get_mimetype(path))
            existing_file_id = existing_files.get(path.name)

            if mode == SKIP and existing_file_id:
                print(f"Skipped (already exists): {path.name}")
                continue
            elif mode == UPDATE and existing_file_id:
                service.files().update(
                    fileId=existing_file_id,
                    media_body=media,
                    supportsAllDrives=True,
                ).execute()
                updated_count += 1
                print(f"Updated: {path.name}")
            else:
                created = service.files().create(
                    body={"name": path.name, "parents": [folder_id]},
                    media_body=media,
                    fields="id",
                    supportsAllDrives=True,
                ).execute()
                existing_files[path.name] = created["id"]
                uploaded_count += 1
                print(f"Uploaded: {path.name}")

        except Exception as e:
            print(f"Failed to upload {path.name}: {e}")

    print(
        f"Upload complete to {label} folder '{folder['name']}'. "
        f"Created {uploaded_count}, updated {updated_count}."
    )

def organize_new_input() -> None:
    if not PROCESSED_INPUT_DIR.exists():
        print(f"Processed folder not found: {PROCESSED_INPUT_DIR}")
        return

    try:
        txt_files = [
            f for f in PROCESSED_INPUT_DIR.glob("*")
            if f.is_file() and f.suffix.lower() == ".txt"
        ]
    except Exception as e:
        print(f"Error reading files: {e}")
        return

    if not txt_files:
        print("No .txt files found to upload.")
        return

    upload_to_drive(txt_files, PROCESSED_TXT_FOLDER_ID, "processed files", mode="skip_if_exists")



def run_new_input() -> None:
    print("\n=== Export new docs from Google Drive ===")
    export_new_docs(DRIVE_FOLDER_ID)

    print("\n=== Add new txt files into database.jsonl + embed.jsonl and move new input files to the processed folder ===")
    update_database()
    update_embeddings()

    print("\n=== Upload processed new input files back to Google Drive ===")
    organize_new_input()
    upload_to_drive([NEW_DOCS_DIR], PROCESSED_DOCS_FOLDER_ID, "process_docs", mode="skip_if_exists")

    print("\n== Upload updated database.jsonl and embed.jsonl to Google Drive===")
    upload_to_drive([DATABASE_JSONL], DATABASE_FOLDER_ID, "database", mode="update")
    upload_to_drive([EMBED_JSONL], EMBED_FOLDER_ID, "embedding", mode="update")

    print("\n=== Sync processed folder down locally ===")
    if not DRIVE_FOLDER_ID:
        print("Skipping sync-down: DRIVE_FOLDER_ID is empty or invalid.")
    else:
        run_sync(DRIVE_FOLDER_ID, BACKEND_DIR)

    print("\n Finish syncing new input ✅")


if __name__ == "__main__":
    run_new_input()
