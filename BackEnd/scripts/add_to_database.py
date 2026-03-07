# Input: get raw input / new input / existing jsonl / existing database
# Output: an updated database.jsonl that includes all the data we have
# 

"""
This programs handles new inputs and not overwriting the original data.
It saves runtime while handling id order issues and uncategorized new input data
"""

import json
import re
from itertools import count
from pathlib import Path

# =========================
# Config
# =========================
script_dir = Path(__file__).parent
ONLINE_INPUT_DIR = script_dir / "../drive_data/essays_jsonl/online_essays"
COLLECTED_JSONL = script_dir / "../drive_data/essays_jsonl/collected_essays.jsonl"
NEW_INPUT_DIR = script_dir / "../drive_data/organized_data/new_input"
DATABASE_PATH = script_dir / "../drive_data/finalized_data_jsonl/database.jsonl"


def load_online_essays(id_counter: count) -> list[dict]:
    """
    Read all .jsonl files from ONLINE_INPUT_DIR and reassign IDs
    """
    if not ONLINE_INPUT_DIR.exists():
        print(f"  [skip] Online input dir not found: {ONLINE_INPUT_DIR}")
        return []

    essays = []
    for file_path in sorted(ONLINE_INPUT_DIR.glob("*.jsonl")):
        print(f"  Loading online jsonl: {file_path.name}")
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                data    = json.loads(line)
                topic   = (data.get("topic")   or "").strip()
                content = (data.get("content") or "").strip()

                if not topic or not content:
                    continue

                data["topic"]   = topic
                data["content"] = content
                data["id"]      = f"essay_{next(id_counter):04d}"
                essays.append(data)

    print(f"  Loaded {len(essays)} essays from online sources\n")
    return essays


def load_collected_essays(id_counter: count) -> list[dict]:
    """
    Read collected_essays.jsonl and reassigns IDs
    """
    if not COLLECTED_JSONL.exists():
        print(f"  [skip] collected_essays.jsonl not found: {COLLECTED_JSONL}")
        return []

    essays = []
    with open(COLLECTED_JSONL, "r", encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)

            topic   = (data.get("topic")   or "").strip()
            content = (data.get("content") or "").strip()

            if not topic or not content:
                continue

            data["topic"]   = topic
            data["content"] = content
            data["id"]      = f"essay_{next(id_counter):04d}"
            essays.append(data)

    print(f"  Loaded {len(essays)} essays from collected_essays.jsonl\n")
    return essays


def load_new_input_essays(id_counter: count) -> list[dict]:
    """
    Read all .txt files from NEW_INPUT_DIR and the type of the essay is detected by filename.
    """
    essays = []
    if not NEW_INPUT_DIR.exists():
        print(f"  [skip] new_input/ not found: {NEW_INPUT_DIR}")
        return essays

    for file_path in sorted(NEW_INPUT_DIR.rglob("*.txt")):
        with file_path.open(encoding="utf-8-sig") as f:
            text = f.read()

        text = text.strip()
        text = re.sub(r'\n{3,}', '\n\n', text)

        sections = split_topic_content(text)
        essay_type, school = get_essay_type(file_path)

        for section in sections:
            essays.append({
                "id":          f"essay_{next(id_counter):04d}",
                "topic":       section["topic"],
                "content":     section["content"],
                "type":        essay_type,
                "school":      school,
                "public":      False,
                "source_file": file_path.name
            })

    print(f"  Loaded {len(essays)} new essays from new_input/\n")
    return essays


def split_topic_content(text):
    """
    Read the file and split the prompt and content by identifying the target 
    text that are included in each file. 
    """
    section = re.split(r'(prompt:)', text, flags=re.IGNORECASE)
    sections = []

    # starting from index 1 (prompt: ...), index 0 = ""
    for i in range(1, len(section) - 1, 2):
        info = section[i] + section[i+1]

        # Search for the key words, prompt and label
        # Then extract all the words after each label
        prompt = re.search(r'prompt:\s*(.*)', info, re.IGNORECASE)
        content = re.search(r'content:\s*(.*)', info, re.IGNORECASE | re.DOTALL)

        # check if both exist then put each text into its category
        if prompt and content:
            sections.append({
                "topic": prompt.group(1).strip(),
                "content": content.group(1).strip()
            })
    return sections


def get_essay_type(path):
    """
    Retrieve the folder name and the file name. If the folder name or the file name matches, then return the type of essay and the school

    input: path of the file
    output: [type, school]
    """
    folder_name = path.parent.name
    file_name = path.stem.lower()

    if folder_name == "commonapp" or "common" in file_name:
        return "personal statement", "none"
    elif folder_name == "uc" or "uc" in file_name:
        return "uc piq", "university of california"
    
    if " - " in file_name:
        return "supplementals", file_name.split(" - ")[0].strip()
    else: 
        return "supplementals", file_name.strip()


def get_next_id():
    """
    Read the last line of database.jsonl and return the next available ID number.
    Returns -1 if the database doesn't exist or is empty.
    """
    if not DATABASE_PATH.exists():
        return -1
    
    last_line = None
    with open(DATABASE_PATH, "r", encoding = "utf-8") as f:
        for line in f:
            last_line = line
    
    if last_line:
        last_id = json.loads(last_line)["id"]
        return (int)(last_id.split("_")[1]) + 1


# =========================
# Main
# =========================
def main():
    if_database = (not DATABASE_PATH.exists()) or DATABASE_PATH.stat().st_size == 0

    # if database.jsonl does not exist or nothing inside, add everything together
    if (if_database):
        print("\n===Building database.jsonl===\n")
        counter = count(1)

        online_essays = load_online_essays(counter)
        collected_essays = load_collected_essays(counter)
        new_essays = load_new_input_essays(counter)
        all_essays = online_essays + collected_essays + new_essays

        if not all_essays:
            print("No essays found, please check.")
            return

        DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(DATABASE_PATH, "w", encoding="utf-8") as f:
            for essay in all_essays:
                f.write(json.dumps(essay, ensure_ascii=False) + '\n')
            
        print(f"Done! Created database.jsonl file with {len(all_essays)} essays")
    
    # if database.jsonl does exist, just append the new ones inside
    else:
        # get next id and append
        counter = count(get_next_id())
        new_essays = load_new_input_essays(counter)

        if not new_essays:
            print("No new essays found in new_input/. Nothing appended.")
            return

        with open(DATABASE_PATH, "a", encoding="utf-8") as f:
            for essay in new_essays:
                f.write(json.dumps(essay, ensure_ascii=False) + "\n")

        print(f"Done. Appended {len(new_essays)} new essays to database.jsonl.")


if __name__ == "__main__":
    main()