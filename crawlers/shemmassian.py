# crawlers/shemmassian.py

from __future__ import annotations

from pathlib import Path
from typing import List, Dict
from bs4 import BeautifulSoup
import json

from common import fetch_html

# This page contains all 14 essay examples in one single article.
BASE_URL = "https://www.shemmassianconsulting.com/blog/college-essay-examples"

# These phrases indicate the start of an advertisement or a promotional block.
# When encountered, we stop collecting essay text.
STOP_PHRASES = [
    "Need inspiration for your Common App personal statement",
    "Looking for supplemental essay examples",
    "Common App Personal Statement Premium Example Library",
    "College Supplemental Essay Premium Example Hub",
    "Struggling to write your college essays",
]

PROMPTS = [
    "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
    "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
    "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
    "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design"
]
special_case_prompt = "The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning."
prompt_by_essay = [
    PROMPTS[5], PROMPTS[6], PROMPTS[4], special_case_prompt, PROMPTS[4], 
    PROMPTS[0], PROMPTS[0], PROMPTS[5], PROMPTS[1], 
    PROMPTS[1], PROMPTS[1], PROMPTS[3], PROMPTS[2], PROMPTS[0]
]

def parse_shemmassian_college_examples(
    url: str = BASE_URL,
) -> List[Dict[str, str]]:
    """
    Parse the Shemmassian article that contains multiple essay examples.

    Returns a list of dictionaries, each representing one essay:
    {
        "source": "shemmassian",
        "url": "...",
        "example_id": 1,
        "label": "College essay example #1",
        "school_info": "This is a college essay that worked for Harvard University.",
        "essay_type": "personal" or "supplemental",
        "text": "Full essay text..."
    }
    """
    html = fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")

    # The main content is typically inside an <article> element.
    # If not found, use the entire soup.
    article = soup.find("article") or soup

    # Collect all <h2> elements whose text begins with "College essay example".
    h2_list = []
    for h in article.find_all("h2"):
        title = h.get_text(strip=True).lower()
        if title.startswith("college essay example"):
            h2_list.append(h)

    examples: List[Dict[str, str]] = []

    for idx, h2 in enumerate(h2_list):
        example_id = idx

        topic = prompt_by_essay[idx-1]
        if idx == 4:
            school = "Stanford"
        else:
            school = "none"
        school_info = ""
        essay_type = "personal statement"  # default type
        paragraphs: List[str] = []
        started = False

        

        # Start scanning paragraph nodes after the current <h2>
        node = h2.next_sibling

        while node:
            node_name = getattr(node, "name", None)

            # Stop if we encounter the next <h2> that begins a new example
            if node_name == "h2":
                text_h2 = node.get_text(strip=True).lower()
                if text_h2.startswith("college essay example"):
                    break

            if node_name == "p":
                text = node.get_text(strip=True)
                if not text:
                    pass  # ignore empty paragraphs
                # First paragraph containing "worked for" or "this student" is the school info
                elif ("worked for" in text.lower() or "this student" in text.lower()) and not school_info:
                    school_info = text
                    started = True
                    if "supplemental essay" in text.lower():
                        essay_type = "supplemental"
                # Skip "(Suggested reading: ...)" lines
                elif text.startswith("(Suggested reading"):
                    pass
                # Stop if this paragraph is part of an advertisement/promo block
                elif any(phrase in text for phrase in STOP_PHRASES):
                    break
                else:
                    if started or not school_info:
                        paragraphs.append(text)

            node = node.next_sibling

        essay_text = "\n\n".join(paragraphs).strip()

        if essay_text:
            examples.append(
                {
                    "id": f"essay_{example_id:04d}",
                    "topic": topic,
                    "content": essay_text,
                    "type": essay_type,
                    "school": school, 
                    "public": True,
                    "source_file": "online",
                }
            )

    # Debug print: how many essays were parsed
    print(f"Parsed {len(examples)} essays from {url}")

    return examples


def crawl_shemmassian(output_path: str | Path | None = None) -> int:
    """
    Execute the crawler:
      - Parse all essay examples from the article
      - Save them as a JSONL file

    Default output path:
        (project_root) / "shemmassian_college_essays.jsonl"

    Returns:
        Number of essays saved.
    """
    essays = parse_shemmassian_college_examples(BASE_URL)

    # If no output path is provided, save to the project root.
    if output_path is None:
        project_root = Path(__file__).parent
        output_path = project_root / "../data/essays_jsonl/shemmassian_college_essays.jsonl"
    else:
        output_path = Path(output_path)

    # Ensure the directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write to JSONL
    with output_path.open("w", encoding="utf-8") as f:
        for e in essays:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    print(f"Saved {len(essays)} essays to {output_path}")
    return len(essays)


if __name__ == "__main__":
    crawl_shemmassian()
