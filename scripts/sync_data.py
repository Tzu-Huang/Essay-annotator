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
