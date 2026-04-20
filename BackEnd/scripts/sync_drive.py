# Run this in the terminal: 
# python scripts/sync_drive.py --folder_id 1AhKLsQJaAQF-tJ5q6y5ajGsEb9mA0jgw --out drive_data/

import os
import io
import argparse
from pathlib import Path
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent

SCOPES = ["https://www.googleapis.com/auth/drive"]
CLIENT_SECRET_FILE = BACKEND_DIR / "client_secret.json"
TOKEN_FILE = BACKEND_DIR / "token.json"

def get_creds():
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
            # creds = flow.run_console() # This one is for aws
        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(creds.to_json())
    return creds

def list_children(service, folder_id):
    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false",
        fields="files(id,name,mimeType,modifiedTime,size)"
    ).execute()
    return results.get("files", [])

def download_file(service, file_id, out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    request = service.files().get_media(fileId=file_id)
    with io.FileIO(out_path, "wb") as fh:
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()

def sync_folder(service, folder_id, out_dir: Path):
    items = list_children(service, folder_id)

    for item in items:
        name = item["name"]
        mime = item["mimeType"]
        file_id = item["id"]

        if mime == "application/vnd.google-apps.folder":
            sync_folder(service, file_id, out_dir / name)
        else:
            out_path = out_dir / name
            download_file(service, file_id, out_path)
            print(f"Downloaded: {out_path}")


def run_sync(folder_id: str, out_dir: str | Path) -> None:
    creds = get_creds()
    service = build("drive", "v3", credentials=creds)

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    sync_folder(service, folder_id, out_dir)
    print("✅ Sync complete.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder_id", required=True, help="Google Drive folder ID to sync")
    parser.add_argument("--out", default="backend/data", help="Local output directory")
    args = parser.parse_args()
    run_sync(args.folder_id, args.out)

if __name__ == "__main__":
    main()
