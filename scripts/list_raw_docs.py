"""
list_raw_docs.py

Purpose:
This script lists all Google Docs files that are DIRECTLY located under
the specified `raw_curated` folder in Google Drive.

Important notes:
- This script does NOT export or download any files.
- This script only checks one folder level (non-recursive).
- It is meant as a sanity check before building export logic.

How to use:
1. Set KEY_PATH to your Service Account JSON key file.
3. Run:
   python scripts/list_raw_docs.py

Expected output:
- A list of Google Docs names and their corresponding file IDs.

This script is safe to run multiple times and has no side effects.
"""


from google.oauth2 import service_account
from googleapiclient.discovery import build

# ====== CONFIG ======
# TODO: Change this to your own path
KEY_PATH = r"C:\Users\USER\Desktop\key\essay-project-key.json"
RAW_FOLDER_ID = "1-_zkDQMHxtNVeIQsXsKTa6NYgNqEF8qO"

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
DOC_MIME = "application/vnd.google-apps.document"
# ====================

def main():
    creds = service_account.Credentials.from_service_account_file(
        KEY_PATH, scopes=SCOPES
    )
    service = build("drive", "v3", credentials=creds)

    query = (
        f"'{RAW_FOLDER_ID}' in parents "
        f"and mimeType = '{DOC_MIME}' "
        f"and trashed = false"
    )

    results = service.files().list(
        q=query,
        fields="files(id, name)"
    ).execute()

    files = results.get("files", [])

    if not files:
        print("No Google Docs found in raw_data.")
        return

    print(f"Found {len(files)} Google Docs in raw_data:\n")
    for f in files:
        print(f"- {f['name']}  |  ID: {f['id']}")

if __name__ == "__main__":
    main()
