import requests
from bs4 import BeautifulSoup
import json

url = "https://blog.collegevine.com/common-app-essay-examples"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

# Find all headings that start with "Prompt"
headings = soup.find_all("h3")
prompts = [h for h in headings if h.get_text(strip=True).startswith("Prompt")]

with open("collegevine_essays.jsonl", "w", encoding="utf-8") as f:
    for h in prompts:
        prompt_text = h.get_text(strip=True)
        
        essays = []
        current_essay = []

        # Collect siblings until the next prompt
        for sibling in h.find_next_siblings():
            # Stop at next prompt

            if sibling.name == "h3" and sibling.get_text(strip=True).startswith("Prompt"):
                break
           
	    # Skip analysis paragraphs
            text = sibling.get_text(strip=True) if sibling else ""
            if "Analysis" in text:
                continue
           
	    # Collect paragraphs or div text
            if sibling.name in ["p", "div"] and text:
                current_essay.append(text)

            # If heading indicates a new example essay, save the previous one
            if sibling.name in ["h4", "h5"] and "Example" in text:
                if current_essay:
                    essays.append("\n".join(current_essay).strip())
                    current_essay = []

        # Save any leftover essay text
        if current_essay:
            essays.append("\n".join(current_essay).strip())

        # Write each essay separately in JSONL
        for essay_text in essays:
            if essay_text:  # skip empty
                obj = {"prompt": prompt_text, "essay": essay_text}
                f.write(json.dumps(obj, ensure_ascii=False) + "\n")

print("Saved all essays to collegevine_essays.jsonl")
                                                                                               
