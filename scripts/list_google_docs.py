# Name: Zackery Liu
# Input: Google Drive folder (RAW_FOLDER_ID) containing raw curated documents
# Output: Printed list of Google Docs names and their corresponding file IDs

from google.oauth2 import service_account
from googleapiclient.discovery import build

# =========================
# Config
# =========================

# Local path to Google Account JSON Key
KEY_PATH = r"C:\Users\USER\Desktop\key\essay-project-key.json" #Zack's API key

# Read-only access to Google Drive
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# DO NOT CHANGE
DOC_MIME = "application/vnd.google-apps.document"

# This is the file path that you want to look at 
FOLDER_ID = "1-_zkDQMHxtNVeIQsXsKTa6NYgNqEF8qO"

# =========================
# Helper Functions
# =========================
def list_google_docs(folder_id: str):
    """
    Input:
    - folder_id: Google Drive folder ID

    Output:
    - Prints Google Docs names and file IDs directly under the folder
    """

    # Step 1: Authenticate
    creds = service_account.Credentials.from_service_account_file(
        KEY_PATH,
        scopes=SCOPES
    )
    service = build("drive", "v3", credentials=creds)

    # Step 2: Build query (non-recursive, Google Docs only)
    query = (
        f"'{folder_id}' in parents "
        f"and mimeType = '{DOC_MIME}' "
        f"and trashed = false"
    )

    results = service.files().list(
        q=query,
        fields="files(id, name)"
    ).execute()

    files = results.get("files", [])

    # Step 3: Print results
    if not files:
        print("No Google Docs found in this folder.")
        return

    print(f"Found {len(files)} Google Docs:\n")
    for f in files:
        print(f"- {f['name']}  |  ID: {f['id']}")

# =========================
# Main logic
# =========================
def main():
    list_google_docs(FOLDER_ID)

if __name__ == "__main__":
    main()
