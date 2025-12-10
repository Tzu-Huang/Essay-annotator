# crawlers/shemmassian.py

from __future__ import annotations

from pathlib import Path
from typing import List, Dict

from bs4 import BeautifulSoup
import json

from .common import fetch_html

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

    for idx, h2 in enumerate(h2_list, start=1):
        label = h2.get_text(strip=True)
        example_id = idx

        school_info = ""
        essay_type = "personal"  # default type
        paragraphs: List[str] = []

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
                # First paragraph containing "worked for" is the school info
                elif "worked for" in text.lower() and not school_info:
                    school_info = text
                    if "supplemental essay" in text.lower():
                        essay_type = "supplemental"
                # Skip "(Suggested reading: ...)" lines
                elif text.startswith("(Suggested reading"):
                    pass
                # Stop if this paragraph is part of an advertisement/promo block
                elif any(phrase in text for phrase in STOP_PHRASES):
                    break
                else:
                    paragraphs.append(text)

            node = node.next_sibling

        essay_text = "\n\n".join(paragraphs).strip()

        if essay_text:
            examples.append(
                {
                    "source": "shemmassian",
                    "url": url,
                    "example_id": example_id,
                    "label": label,
                    "school_info": school_info,
                    "essay_type": essay_type,
                    "text": essay_text,
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
        project_root = Path(__file__).resolve().parent.parent
        output_path = project_root / "shemmassian_college_essays.jsonl"
    else:
        output_path = Path(output_path)

    # Ensure the directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write to JSONL
    with output_path.open("w", encoding="utf-8") as f:
        for e in essays:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    print(f"✅ Saved {len(essays)} essays to {output_path}")
    return len(essays)


if __name__ == "__main__":
    crawl_shemmassian()
