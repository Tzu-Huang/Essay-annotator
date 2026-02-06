import requests
from pathlib import Path
from itertools import count
from bs4 import BeautifulSoup
import json
import re

url = "https://blog.collegevine.com/common-app-essay-examples"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

# Use script directory as base for relative paths
script_dir = Path(__file__).parent
output_path = script_dir / "../data/essays_json/vine_commonapp.jsonl"

# Find all prompt descriptions (e.g., "Prompt #1: Some students have...")
prompt_descriptions = {}
for h in soup.find_all("h3"):
    text = h.get_text(strip=True)
    # Match "Prompt #X:" followed by description
    match = re.match(r"Prompt #(\d+):\s*(.+)", text)
    if match:
        prompt_num = match.group(1)
        prompt_descriptions[prompt_num] = match.group(2)

# Find all example essay headers (e.g., "Prompt #1, Example #1")
example_headers = [h for h in soup.find_all("h3") if "Example" in h.get_text()]

with open(output_path, "w", encoding="utf-8") as f:
    counter = count(1)
    for header in example_headers:
        header_text = header.get_text(strip=True)
        
        # Extract prompt number from header
        match = re.match(r"Prompt #(\d+)", header_text)
        prompt_num = match.group(1) if match else "Unknown"
        prompt_text = prompt_descriptions.get(prompt_num)
        
        # Collect essay paragraphs until next h3 (using find_all_next for nested content)
        essay_lines = []
        for elem in header.find_all_next():
            if elem.name == "h3":
                break
            if elem.name == "p":
                text = elem.get_text(strip=True)

                # Skip empty, analysis sections, and explanations
                if text and "Analysis" not in text and not text.startswith("Why"):
                    essay_lines.append(text)
        
        if essay_lines:
            obj = {
                "id": f"essay_{next(counter):02d}",
                "type": "personal statement",
                "topic": prompt_text,
                "content": "\n".join(essay_lines), 
                "public": True, 
                "source_file": url
            }
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")

print("Saved all essays to vine_commonapp.jsonl")