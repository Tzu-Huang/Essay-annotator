"""
test_drive_connection.py

Purpose:
This script performs a minimal test between the local Python
environment and the Google Drive API using a Service Account.

It verifies that:
1. The Service Account JSON key is valid.
2. Google Drive API is enabled for the correct Google Cloud project.
3. The Service Account can successfully authenticate and access Google Drive.

This script DOES NOT:
- Modify any files
- Download or export any documents
- Depend on a specific folder structure

How to use:
1. Make sure you have:
   - Received a JSON key file from Zackery
2. Update KEY_PATH to point to your local JSON key file (outside the repo).
3. Run:
   python scripts/test_drive_connection.py

Expected output:
- A list of sample files visible to the Service Account, OR
- A message confirming connection with no visible files.

This script is intended for debugging and setup verification only.
"""

from google.oauth2 import service_account
from googleapiclient.discovery import build

# TODO: Please change this to your own path
KEY_PATH = r"C:\Users\USER\Desktop\key\essay-project-key.json"

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

def main():
    creds = service_account.Credentials.from_service_account_file(
        KEY_PATH, scopes=SCOPES
    )
    service = build("drive", "v3", credentials=creds)

    # We only test for the first five result (just for testing)
    results = service.files().list(
        pageSize=5,
        fields="files(id, name)"
    ).execute()

    files = results.get("files", [])
    if not files:
        print("Connected to Drive API, but no files are visible.")
    else:
        print("Connected to Drive API. Sample files:")
        for f in files:
            print(f"- {f['name']}")

if __name__ == "__main__":
    main()
