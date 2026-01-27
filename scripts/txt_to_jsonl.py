"""
txt_to_jsonl.py

Purpose:
This program convert .txt file to JSONL form

How to use:
1. Set INPUT_DIR and OUTPUT_FILE to target folders
2. Run:
   python scripts/txt_to_jsonl.py

"""

import os
import json

INPUT_DIR = "data/organized_data"
OUTPUT_FILE = "data/essays_json/essays.json"

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

def clean_text(text: str) -> str:
    """
    Clean the raw essay text.

    Currently, this function only removes leading and trailing whitespace.
    It is intentionally kept minimal so cleaning rules can be expanded later
    (e.g., removing headers, footers, extra blank lines).
    """
    return text.strip()

def main():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        for i, filename in enumerate(sorted(os.listdir(INPUT_DIR)), start=1):
            if not filename.endswith(".txt"):
                continue
            
            file_path = os.path.join(INPUT_DIR, filename)

            with open(file_path, "r", encoding="utf-8-sig") as f:
                text = f.read()

            text = clean_text(text)

            # Record it as a jsonl file
            record = {
                "id": f"essay_{i:04d}",
                "text": text,
                "source_file": filename
            }
            print(filename, repr(text[:20]))
            # making sure this is a jsonl file
            out.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(".txt to json conversion completed")


if __name__ == "__main__":
    main()