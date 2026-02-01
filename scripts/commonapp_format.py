from pathlib import Path
from itertools import count
import json
import re


commonapp_dir = Path("../data/organized_data/commonapp")

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
                "type": "commonapp", 
                "topic": section["topic"],
                "content": section["content"], 
                "source_file": file_path.name
            }
            commonapp_data.append(essay)


    with open("commonapp.json", "w", encoding="utf-8") as f:
        json.dump(commonapp_data, f, ensure_ascii=False, indent = 2)


def split_topic_content(text):
    section = re.split(r'(prompt:)', text, flags=re.IGNORECASE)
    list = []

    for i in range(1, len(section), 2):
        info = section[i] + section[i+1]

        # extract all the words after each target label
        prompt = re.search(r'prompt:\s*(.*)', info, re.IGNORECASE)
        content = re.search(r'content:\s*(.*)', info, re.IGNORECASE | re.DOTALL)

        # check if both exits then put each text into its category
        if prompt and content:
            list.append({
                "topic": prompt.group(1).strip(),
                "content": content.group(1).strip()
            })
    return list


if __name__ == "__main__" :
    main()
