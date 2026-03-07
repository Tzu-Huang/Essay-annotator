# Run this in the terminal: 
# python scripts/sync_drive_aws.py --folder_id 1AhKLsQJaAQF-tJ5q6y5ajGsEb9mA0jgw --out drive_data/

import os
import io
import argparse
from pathlib import Path
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
CLIENT_SECRET_FILE = "client_secret.json"
TOKEN_FILE = "token.json"

def get_creds():
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent"
    )

    print("\nOpen this URL in your browser:\n")
    print(auth_url)
    print()

    code = input("Paste the authorization code here: ").strip()

    flow.fetch_token(code=code)
    return flow.credentials

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

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder_id", required=True, help="Google Drive folder ID to sync")
    parser.add_argument("--out", default="backend/data", help="Local output directory")
    args = parser.parse_args()

    creds = get_creds()
    service = build("drive", "v3", credentials=creds)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    sync_folder(service, args.folder_id, out_dir)
    print("✅ Sync complete.")

if __name__ == "__main__":
    main()