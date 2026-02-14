# Name: Amanda
# Input: get raw txt files from the organized_data/commonapp
# Output: output a jsonl file that clears out the information of each essay, 
#         including id, topic, content, type, public, source_file


from pathlib import Path
from itertools import count
import json
import re

# =========================
# Config
# =========================

# File parent path, input path, output path
script_dir = Path(__file__).parent
input_dir = script_dir / "../data/organized_data/commonapp/"
output_path = script_dir / "../data/finalized_data_json/commonapp.jsonl"

# =========================
# Helper functions
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

        # extract all the words after each target label
        prompt = re.search(r'prompt:\s*(.*)', info, re.IGNORECASE)
        content = re.search(r'content:\s*(.*)', info, re.IGNORECASE | re.DOTALL)

        # check if both exist then put each text into its category
        if prompt and content:
            list.append({
                "topic": prompt.group(1).strip(),
                "content": content.group(1).strip()
            })
    return list


# =========================
# Main logic
# =========================

def main():
    if not input_dir.exists() or not input_dir.is_dir(): 
        print(f"The folder {input_dir} does not exist or is not a folder.")
        return
    
    commonapp_data = []

    id_counter = count(1) # Counter for the id

    # Load all of the files in the folder
    for file_path in input_dir.glob("*.txt"):
        with file_path.open(encoding="utf-8-sig") as f: 
             text = f.read();
        
        # Record the splitted prompt and content list
        sections = split_topic_content(text)
        
        # Merge the collected info in to the final dict
        for section in sections:
            essay = {
                "id": f"essay_{next(id_counter):04d}", 
                "topic": section["topic"],
                "content": section["content"], 
                "type": "personal statement", 
                "public": False,
                "source_file": file_path.name
            }
            commonapp_data.append(essay)
    
    # dump all the json string(from dict) and write it 
    # in the commonapp.jsonl file 
    with open(output_path, "w", encoding="utf-8") as f:
        for essay in commonapp_data:
            f.write(json.dumps(essay, ensure_ascii=False) + "\n")
    print("Saved all essays to commonapp.jsonl")


if __name__ == "__main__" :
    main()
