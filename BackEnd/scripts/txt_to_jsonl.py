# Name: Zackery Liu
# Input: txt folder
# Output: jsonl files

import os
import json

# =========================
# Config
# =========================
INPUT_DIR = "data/new_input"
OUTPUT_FILE = "data/essays_jsonl/essays_new.jsonl"

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

# =========================
# Helper functions
# =========================
def clean_text(text: str) -> str:
    """
    Clean the raw essay text.

    Currently, this function only removes leading and trailing whitespace.
    It is intentionally kept minimal so cleaning rules can be expanded later
    (e.g., removing headers, footers, extra blank lines).
    """
    return text.strip()

# =========================
# Main 
# =========================
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