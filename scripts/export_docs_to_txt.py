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
STATE_FILE = Path("data/processed/exported_ids.json")
# ====================

def load_state():
    """
    Load the state file that tracks exported Google Drive file IDs.

    Returns:
        dict: Mapping of file_id -> metadata for already-exported documents.
    """
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}

def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(
        json.dumps(state, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


# def list_subfolders(service, parent_id):
#     query = f"'{parent_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
#     results = service.files().list(
#         q=query,
#         fields="files(id, name)"
#     ).execute()
#     return results.get("files", [])

def list_all_files_in_folder(service, folder_id):
    query = f"'{folder_id}' in parents and trashed = false"
    results = service.files().list(
        q=query,
        fields="files(id, name, mimeType)"
    ).execute()

    # Return nothing if the folder is empty
    return results.get("files", [])

# def list_docs_in_folder(service, folder_id):
#     query = (
#         f"'{folder_id}' in parents "
#         f"and mimeType = '{DOC_MIME}' "
#         f"and trashed = false"
#     )
#     results = service.files().list(
#         q=query,
#         fields="files(id, name)"
#     ).execute()
#     return results.get("files", [])

def main():
    creds = service_account.Credentials.from_service_account_file(
        KEY_PATH, scopes=SCOPES
    )

    # Build Google Drive API client
    service = build("drive", "v3", credentials=creds)

    # Load previously exported file IDs
    state = load_state()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("\nScanning...")

    # List all files in the folder
    files = list_all_files_in_folder(service, RAW_FOLDER_ID)

    if not files:
        print("No files found")
        return

    exported_count = 0
    skipped_count = 0

    for f in files:
        file_id = f["id"]
        name = f["name"]
        mime = f["mimeType"]

        # Skip files that have already been processed
        if file_id in state:
            continue
        
        print(f" Exporting Google Doc:  {name}")

        # Case 1: Google Docs -> export to txt
        if mime == DOC_MIME:
            # Export Google Doc as plain text
            request = service.files().export(
                fileId=file_id,
                mimeType="text/plain"
            )
            content = request.execute().decode("utf-8")

        # Case 2: .docx -> download bytes
        elif mime == DOCX_MIME:

            # Download the actual content
            request = service.files().get_media(fileId=file_id)
            docx_bytes = request.execute()

            # Convert docx - > text
            from io import BytesIO
            import docx 
            doc = docx.Document(BytesIO(docx_bytes))
            content = "\n".join(p.text for p in doc.paragraphs) 

        else:
            skipped_count += 1
            print(f"unspport type {name}")
            continue

        # Save as .txt (same as your existing code)
        safe_name = "".join(c for c in name if c.isalnum() or c in " _-").strip()
        out_path = OUT_DIR / f"{safe_name}.txt"
        out_path.write_text(content, encoding="utf-8")

        state[file_id] = {
            "name": name,
            "source_folder": "raw_curated",
            "mimeType": mime,
            "exported_at": datetime.utcnow().isoformat(),
            "output": str(out_path)
        }
        exported_count += 1

        print(f"\nExported {exported_count} Google Docs and google docx.")
        print(f"Skipped {skipped_count} non-Google-Docs files.")

if __name__ == "__main__":
    main()
