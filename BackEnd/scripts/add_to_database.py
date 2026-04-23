# Input: get raw input / new input / existing jsonl / existing database
# Output: an updated database.jsonl that includes all the data we have
# 

"""
This programs handles new inputs and not overwriting the original data.
It saves runtime while handling id order issues and uncategorized new input data
"""

import json
import re
import shutil
from itertools import count
from pathlib import Path

# =========================
# Config
# =========================
script_dir = Path(__file__).parent
ONLINE_INPUT_DIR = script_dir / "../drive_data/essays_jsonl/online_essays"
COLLECTED_JSONL = script_dir / "../drive_data/essays_jsonl/collected_essays.jsonl"
NEW_INPUT_DIR = script_dir / "../drive_data/organized_data/new_input"
PROCESSED_INPUT_DIR = NEW_INPUT_DIR / "processed"
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

# =========================
# Make essay signature
# =========================
'''
We're doing this so that it can ensure that there are no duplicate essays 
in the database. 
'''

def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())

def make_essay_signature(topic: str, content: str, source_file: str | None = None):
    return (
        normalize_text(topic).lower(),
        normalize_text(content).lower(),
        (source_file or "").strip().lower(),
    )

# load the essay signatures in the database.jsonl (topic + content + source)
def load_existing_signatures():
    signatures = set()

    if not DATABASE_PATH.exists():
        print(f"  database.jsonl has not been created")
        return signatures

    with open(DATABASE_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            try:
                obj = json.loads(line)
            except json.JSONDecodeError:  # invalid line, skip
                continue

            topic = obj.get("topic") or ""
            content = obj.get("content") or ""
            source_file = obj.get("source_file")

            if topic and content:
                signatures.add(make_essay_signature(topic, content, source_file))

    return signatures

# =========================
# Handle new input + move files
# =========================
def load_new_input_essays(id_counter: count, existing_signatures=None) -> list[dict]:
    """
    Read all .txt files from NEW_INPUT_DIR and the type of the essay is detected by filename.
    """
    essays = []
    existing_signatures = existing_signatures or set()

    if not NEW_INPUT_DIR.exists():
        print(f"  [skip] new_input/ not found: {NEW_INPUT_DIR}")
        return essays

    moved_count = 0
    for file_path in sorted(NEW_INPUT_DIR.glob("*.txt")):

        with file_path.open(encoding="utf-8-sig") as f:
            text = f.read()

        text = text.strip()
        text = re.sub(r'\n{3,}', '\n\n', text)

        sections = split_topic_content(text)
        essay_type, school = get_essay_type(file_path)
        file_had_new_essay = False

        for section in sections:
            signature_with_file = make_essay_signature(
                section["topic"],
                section["content"],
                file_path.name,
            )

            if (signature_with_file in existing_signatures):
                print(f"  [skip] Already in database: {file_path.name}")
                continue

            essay = {
                "id":          f"essay_{next(id_counter):04d}",
                "topic":       section["topic"],
                "content":     section["content"],
                "type":        essay_type,
                "school":      school,
                "public":      False,
                "source_file": file_path.name
            }
            essays.append(essay)
            existing_signatures.add(signature_with_file)
            file_had_new_essay = True

        # Once a file has been fully accounted for, move it out of new_input.
        # all(), check if all essay signatures are in existing signatures
        if sections and (file_had_new_essay or all(
            make_essay_signature(section["topic"], section["content"], file_path.name) in existing_signatures
            for section in sections
        )):
            move_processed_file(file_path)
            moved_count += 1


    print(f"  Loaded {len(essays)} new essays from new_input/\n")
    print(f"  Successfully moved {moved_count} files. ")
    return essays


# Move the new input files into a folder under new_input, to eliminate repetition
def move_processed_file(file_path: Path):
    '''
    input: file_path: path of the current processed file
    destination: the folder that this file will relocate
    '''
    relative_path = file_path.relative_to(file_path.parent)
    destination = file_path.parent / "processed" / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(file_path), str(destination))
    print(f"  Moved processed file -> {destination}")


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
    Retrieve the folder name and the file name. Normalize to one format. 
    If the folder name or the file name matches, then return the type of essay and the school

    input: path of the file
    output: [type, school]
    """
    folder_name = path.parent.name
    file_name = path.stem
    folder_name_lower = folder_name.lower()
    file_name_lower = file_name.lower()

    if folder_name_lower == "commonapp" or ("common" in file_name_lower):
        return "Personal Statement", "none"
    elif folder_name_lower == "uc" or ("uc" in file_name_lower):
        return "University of California", "none"
    
    if " - " in file_name:
        return "Supplemental", file_name.split(" - ")[0].strip()
    else: 
        return "Supplemental", file_name.strip()

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
def update_database():
    if_database = (not DATABASE_PATH.exists()) or DATABASE_PATH.stat().st_size == 0
    existing_signatures = load_existing_signatures()

    # if database.jsonl does not exist or nothing inside, add everything together
    if (if_database):
        print("\n===Building database.jsonl===\n")
        counter = count(1)

        online_essays = load_online_essays(counter)
        collected_essays = load_collected_essays(counter)
        new_essays = load_new_input_essays(counter, existing_signatures)
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
        new_essays = load_new_input_essays(counter, existing_signatures)

        if not new_essays:
            print("  No new essays found in new_input/. Nothing appended.")
            return

        with open(DATABASE_PATH, "a", encoding="utf-8") as f:
            for essay in new_essays:
                f.write(json.dumps(essay, ensure_ascii=False) + "\n")

        print(f"Done. Appended {len(new_essays)} new essays to database.jsonl.")


if __name__ == "__main__":
    update_database()