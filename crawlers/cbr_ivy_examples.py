import requests
from bs4 import BeautifulSoup
from pathlib import Path
import json

# Label patterns to identify essay boundaries
LABEL_PATTERNS = ["Common App Essay Prompt:", "Common App Prompt:"]
url = "https://collegeboundreview.com/ivy-league-essay-examples"

script_dir = Path(__file__).parent
output_path = script_dir / "../data/finalized_data_json/collegeBound_commonapp.jsonl"

# find prompt labels in the page, with tag <strong>
def find_labels(soup):
    labels = soup.find_all(
        "strong",
        string=lambda s: s in LABEL_PATTERNS if s is not None else False,
    )
    return labels

# get the prompt text after each strong tag
def get_prompt_text(label):
    prompt_strong = label.find_next("strong")
    return prompt_strong.get_text(strip=True) if prompt_strong else ""

# extract essay contents after each strong label
def get_essay_content(label):
    prompt_strong = label.find_next("strong")
    prompt_text = prompt_strong.get_text(strip=True) if prompt_strong else ""
    
    essay_paragraphs = []
    
    for element in prompt_strong.find_all_next():
        # Check if this element contains a label pattern (boundary)
        elem_text = element.get_text(strip=True) if hasattr(element, 'get_text') else str(element)
        
        # Stop if we reach another label
        if any(pattern in elem_text for pattern in LABEL_PATTERNS):
            if element != prompt_strong and element.name != "span":
                break
        
        # Only collect text from <p> tags
        if element.name == "p":
            text = element.get_text(strip=True)
            # Skip empty, prompt text, and prompt labels
            if text and text != prompt_text:
                if not any(pattern in text for pattern in LABEL_PATTERNS):
                    essay_paragraphs.append(text)
    
    essay_text = "\n\n".join(essay_paragraphs)
    return prompt_text, essay_text


def main():
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    # Find all labels
    labels = find_labels(soup)
    
    # Extract essays
    essays = []
    for i, label in enumerate(labels):
        prompt_text, essay_text = get_essay_content(label)
        
        essays.append({
            "id": f"essay_{i+1:04d}",
            "type": "personal statement",
            "topic": prompt_text,
            "content": essay_text,
            "public": True,
            "source_file": "online",
        })

    # Write to file
    with open(output_path, "w", encoding="utf-8") as f:
        for essay in essays:
            f.write(json.dumps(essay, ensure_ascii=False) + "\n")

    print(f"Saved {len(essays)} essays to collegeBound_commonapp.jsonl!")


if __name__ == "__main__":
    main()