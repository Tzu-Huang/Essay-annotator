from pathlib import Path
from itertools import count
import json
import re

script_dir = Path(__file__).parent
commonapp_dir = script_dir / "../data/organized_data/commonapp/"
output_path = script_dir / "../data/finalized_data_json/commonapp.jsonl"

def main():
    if not commonapp_dir.exists() or not commonapp_dir.is_dir(): 
        print(f"The folder {commonapp_dir} does not exist or is not a folder.")
        return
    
    commonapp_data = []

    id_counter = count(1)

    for file_path in commonapp_dir.glob("*.txt"):
        with file_path.open(encoding="utf-8-sig") as f: 
             text = f.read();
        
        sections = split_topic_content(text)
        
        for section in sections:
            essay = {
                "id": f"essay_{next(id_counter):04d}", 
                "type": "personal statement", 
                "topic": section["topic"],
                "content": section["content"], 
                "public": False,
                "source_file": file_path.name
            }
            commonapp_data.append(essay)
    
    with open(output_path, "w", encoding="utf-8") as f:
        for essay in commonapp_data:
            f.write(json.dumps(essay, ensure_ascii=False) + "\n")
    print("Saved all essays to commonapp.jsonl")


def split_topic_content(text):
    section = re.split(r'(prompt:)', text, flags=re.IGNORECASE)
    list = []

    for i in range(1, len(section), 2):
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

if __name__ == "__main__" :
    main()
