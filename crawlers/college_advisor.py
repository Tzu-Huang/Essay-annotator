import requests
from bs4 import BeautifulSoup
import json

url = "https://www.collegeadvisor.com/resources/common-app-essay-examples/"
html = requests.get(url).text
soup = BeautifulSoup(html, "html.parser")

# find text markers instead of tags
headers = soup.find_all(string=lambda t: t and "Sample Common App Essay" in t)

with open("collegeadvisor.jsonl", "w", encoding="utf-8") as f:
    sample_num = 1

    for header in headers:
        essay_lines = []

        for node in header.parent.find_next_siblings():
            text = node.get_text(strip=True)

            if "Sample Common App Essay" in text:
                break
            if text.startswith("Why this essay"):
                break
            if node.name == "p" and text:
                essay_lines.append(text)

        if essay_lines:
            f.write(json.dumps({
                "sample": f"Sample {sample_num}",
                "essay": "\n".join(essay_lines)
            }, ensure_ascii=False) + "\n")
            sample_num += 1

print("Saved all essays to collegeadvisor.jsonl")

