import requests
from bs4 import BeautifulSoup
import json

url = "https://collegeboundreview.com/ivy-league-essay-examples"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

labels = soup.find_all(string="Common App Essay Prompt:")

with open("ivyLeaque_examples.jsonl", "w", encoding="utf-8") as f:
    for label in labels:
        # Get the prompt
        prompt_node = label.find_next("p")
        prompt_text = prompt_node.get_text(strip=True) if prompt_node else ""

        # Get the essay paragraphs
        essay_paragraphs = []
        next_node = prompt_node.find_next_siblings() if prompt_node else []

        for node in next_node:
            if "Common App Essay Prompt:" in node.get_text():
                break
            if node.name == "p":
                essay_paragraphs.append(node.get_text(strip=True))

        essay_text = "\n".join(essay_paragraphs)

        # Write one JSON object per line
        json_line = json.dumps({"prompt": prompt_text, "essay": essay_text}, ensure_ascii=False)
        f.write(json_line + "\n")

print("Saved all essays to ivyLeaque_examples.jsonl!")

