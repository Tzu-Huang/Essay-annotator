from bs4 import BeautifulSoup
from pathlib import Path
import json
import requests
import re

url = "https://www.collegeadvisor.com/resources/common-app-essay-examples/"
script_dir = Path(__file__).parent
output_path = script_dir / "../drive_data/essays_jsonl/collegeadvisor.jsonl"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; EssayCrawler/0.1; +https://example.com/your-contact)"
}

default_topic = "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design"
prompt_three = "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?"

def main():
    response = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(response.text, "html.parser")

    # Find h3 headers with essay numbers
    essay_headers = [h for h in soup.find_all("h3") if re.search(r"#\d+", h.get_text())]

    with open(output_path, "w", encoding="utf-8") as f:
        essays_count = 0

        for header in essay_headers:

            essay_lines = get_content(header)

            if essay_lines:
                essays_count += 1
                if essays_count == 2:  # handle an exception in the file
                    topic = prompt_three
                else:
                    topic = default_topic
                
                f.write(json.dumps({
                    "id": f"essay_{essays_count:04d}",
                    "topic": topic,
                    "content": "\n\n".join(essay_lines), 
                    "type": "personal statement", 
                    "school": "none",
                    "public": True, 
                    "source_file": "online"
                }, ensure_ascii=False) + "\n")

    print(f"Saved {essays_count} essays to collegeadvisor.jsonl")

def get_content(header):
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
    return essay_lines


if __name__ == "__main__":
    main()