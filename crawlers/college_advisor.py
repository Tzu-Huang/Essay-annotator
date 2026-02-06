import requests
from bs4 import BeautifulSoup
from common import fetch_html
from itertools import count
from pathlib import Path
import json
import re

url = "https://www.collegeadvisor.com/resources/common-app-essay-examples/"

default_topic = "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design"
html = fetch_html(url)
soup = BeautifulSoup(html, "html.parser")
output_path = Path("../data/finalized_data_json/collegeadvisor.jsonl")

# Find h3 headers with essay numbers (e.g., "#1", "#2", etc.)
# Use a function to check get_text() since some have nested tags
essay_headers = [h for h in soup.find_all("h3") if re.search(r"#\d+", h.get_text())]

with open(output_path, "w", encoding="utf-8") as f:
    count = count(1)

    for header in essay_headers:
        essay_lines = []

        for node in header.find_next_siblings():
            # Stop at next heading or div
            if node.name in ["h2", "h3", "div"]:
                break
            text = node.get_text(strip=True)
            # Stop at "Why this essay" analysis section
            if "Why this" in text:
                break
            if node.name == "p" and text:
                essay_lines.append(text)

        if essay_lines:
            essay_id = next(count)
            if essay_id == 2:
                topic = "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?"
            else:
                topic = default_topic
            
            f.write(json.dumps({
                "id": f"essay_{essay_id:02d}",
                "type": "personal statement", 
                "topic": topic,
                "content": "\n".join(essay_lines), 
                "public": True, 
                "url": url
            }, ensure_ascii=False) + "\n")

print("Saved all essays to collegeadvisor.jsonl")