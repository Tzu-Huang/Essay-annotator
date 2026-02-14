# Name: Amanda
# Input: get raw txt files from the organized_data
# Output: output a single jsonl file that contains all the essays, with labels:
#         id, topic, content, type, school, public, source_file


"""
This programs reads all text files from the organized_data folder 
and convert each essay to one single JSON string into a huge JSONL file
that has clean ids and consistent labels for each essay
"""

import json
import re
from itertools import count
from pathlib import Path

# =========================
# Config
# =========================

# Source file
script_dir = Path(__file__).parent
input_dir = script_dir / "../data/organized_data/"
output_path = script_dir / "../data/finalized_data_json/organized_essays.jsonl"


# =========================
# Helper methods
# =========================

def split_topic_content(text):
    """
    Read the file and split the prompt and content by identifying the target 
    text that are included in each file. 
    """
    section = re.split(r'(prompt:)', text, flags=re.IGNORECASE)
    list = []

    # starting from index 1 (prompt: ...), index 0 = ""
    for i in range(1, len(section) - 1, 2):
        info = section[i] + section[i+1]

        # Search for the key words, prompt and label
        # Then extract all the words after each label
        prompt = re.search(r'prompt:\s*(.*)', info, re.IGNORECASE)
        content = re.search(r'content:\s*(.*)', info, re.IGNORECASE | re.DOTALL)

        # check if both exist then put each text into its category
        if prompt and content:
            list.append({
                "topic": prompt.group(1).strip(),
                "content": content.group(1).strip()
            })
    return list


def main():
    # Check if the directory exists
    if not input_dir.exists():
        print(f"Error: {input_dir.absolute()} does not exist")
        return

    data = []
    id_counter = count(1)

    # Load all files in the current directory and all subdirectories
    for file_path in input_dir.rglob("*.txt"):
        
        # Read one file in
        with file_path.open(encoding="utf-8-sig") as f:
            text = f.read()
        
        # Clean up the text: strip whitespace and inconsistent newlines
        text = text.strip()  # Remove leading/trailing whitespace

        text = re.sub(r'\n', '\n\n', text)
        text = re.sub(r'\n\n+', '\n\n', text)

        # Record the splitted prompt and content section
        sections = split_topic_content(text)

        # Extract the essay type from its folder
        folder_name = file_path.parent.name

        # Set the value for essay_type and school
        if folder_name == "commonapp":
            essay_type = "personal statement"
            school = "none"
        elif folder_name == "uc":
            essay_type = "UC PIQ"
            school = "university of california"
        elif folder_name == "supplementals":
            essay_type = "supplementals"
            filename = file_path.stem # .stem refers to the file name

            # Deal with file names if there is - 
            if " - " in filename:
                school = filename.split(" - ")[0].strip()
            else:
                school = filename.strip()  # Use entire filename as school name
        else:
            raise ValueError(f"Unknown folder type: {folder_name}") 

        # Merge in the collected info in the final list
        for section in sections:
            essay = {
                "id": f"essay_{next(id_counter):04d}", 
                "topic": section["topic"],
                "content": section["content"], 
                "type": essay_type, 
                "school": school,
                "public": False,
                "source_file": file_path.name
            }
            data.append(essay)
    
    # Dump all the json string(from dict) and write it 
    # in the commonapp.jsonl file 
    with open(output_path, "w", encoding="utf-8") as f:
        for essay in data:
            f.write(json.dumps(essay, ensure_ascii=False) + "\n")
    print(f"Saved {len(data)} essays to organized_essays.jsonl")

if __name__ == "__main__" :
    main()