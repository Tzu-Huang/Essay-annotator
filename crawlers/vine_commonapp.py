import requests
from pathlib import Path
from itertools import count
from bs4 import BeautifulSoup
import json
import re

url = "https://blog.collegevine.com/common-app-essay-examples"
script_dir = Path(__file__).parent
output_path = script_dir / "../data/finalized_data_json/vine_commonapp.jsonl"

def search_prompt(soup):
    prompt_descriptions = {}

    # search from prompt from h3 tags
    for h in soup.find_all("h3"):
        text = h.get_text(strip=True)

        # Match "Prompt #X:" followed by description
        match = re.match(r"Prompt #(\d+):\s*(.+)", text)

        if match:
            prompt_num = match.group(1)
            prompt_descriptions[prompt_num] = match.group(2)

    return prompt_descriptions

# extract essay paragraphs that are below each prompt title
def get_content(header):
    essay_lines = []
    for elem in header.find_all_next():
        # if reaches the next essay, break
        if elem.name == "h3":
            break
        if elem.name == "p":
            text = elem.get_text(strip=True)
            # Skip empty, analysis sections, and explanations
            if text and "Analysis" not in text and not text.startswith("Why"):
                essay_lines.append(text)
    return essay_lines


def main():
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    # Get prompt descriptions
    prompt_descriptions = search_prompt(soup)

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

            # Get essay content
            essay_lines = get_content(header)

            if essay_lines:
                obj = {
                    "id": f"essay_{next(counter):04d}",
                    "type": "personal statement",
                    "topic": prompt_text,
                    "content": "\n".join(essay_lines),
                    "public": True,
                    "source_file": url
                }
                f.write(json.dumps(obj, ensure_ascii=False) + "\n")

    print("Saved all essays to vine_commonapp.jsonl")


if __name__ == "__main__":
    main()