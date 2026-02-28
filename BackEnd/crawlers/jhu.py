import time
import json
import requests
from bs4 import BeautifulSoup
from itertools import count
from pathlib import Path

script_dir = Path(__file__).parent
output_path = script_dir / "../data/essays_jsonl/jhu_essays.jsonl"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; EssayCrawler/0.1; +https://example.com/your-contact)"
}

PROMPTS = [
    "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
    "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
    "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
    "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design"
]

prompt_by_essay = [
    PROMPTS[5], PROMPTS[0], PROMPTS[5], PROMPTS[0], 
    PROMPTS[1], PROMPTS[2], PROMPTS[5], PROMPTS[4], 
    PROMPTS[4], PROMPTS[4], PROMPTS[4], PROMPTS[0], 
    PROMPTS[4], PROMPTS[4], PROMPTS[4], PROMPTS[4], 
    PROMPTS[4], PROMPTS[1]
]

def fetch_html(url):
    resp = requests.get(url, headers=HEADERS, timeout=10) # Sending request
    resp.raise_for_status()    
    return resp.text 

def get_jhu_essay_links(index_url): #John Hopkins Essay
    """
    Extract all essay URLs from a Johns Hopkins 'Essays That Worked' index page.
    - index_url: URL of the listing page.
    - Returns: list of essay URLs (strings).
    """
    html = fetch_html(index_url)
    soup = BeautifulSoup(html, "html.parser")

    links = []

    # Select all <a> tags inside <article> elements.
    for a in soup.select("article a"):
        href = a.get("href", "")
        text = (a.get_text() or "").strip()
                
        # Keep only URLs that belong to the JHU domain.
        if href.startswith("https://apply.jhu.edu/"):
            links.append(href)

    # Remove duplicates and sort for readability.
    links = sorted(set(links))
    return links


def parse_jhu_essay(url):
    """
    Parse a single JHU essay page.
    Extract:
      - title
      - author (if available)
      - date (if available)
      - full essay text (all <p> tags inside <article>)
    Returns: dictionary with structured info.
    """
    html = fetch_html(url)
    soup = BeautifulSoup(html, "html.parser")

    # 👉 Extract essay paragraphs.
    paragraphs = []

    # Try to locate <article> block where the essay text is.
    article = soup.find("article")
    if not article:
        article = soup  # Fallback: use whole page if <article> not found.

    # Get all paragraph tags inside the area.
    for p in article.find_all("p"):
        text = p.get_text().strip()
        # You may add filters here to remove unrelated content.
        if text:
            paragraphs.append(text)

    # Join paragraphs into a single text with spacing.
    body_text = "\n\n".join(paragraphs)
    body_text.strip()

    return {
        "topic": None,
        "content": body_text,
        "type": "personal statement",
        "school": "none",
        "public": True,
        "source_file": "online",
    }

def crawl_jhu_essays():
    """
    Main crawler function.
    Steps:
      1. Iterate through multiple JHU index pages (different years).
      2. Collect essay URLs.
      3. Parse each essay page.
      4. Save all extracted essays to a JSONL file.
    """
    index_urls = [
        "https://apply.jhu.edu/hopkins-insider/tag/essays-that-worked-2028/",
        "https://apply.jhu.edu/hopkins-insider/tag/essays-that-worked-2027/",
        "https://apply.jhu.edu/hopkins-insider/tag/essays-that-worked-2025/",
    ]

    all_essays = []
    counter = count(1)  # Counter starts fresh each run
    prompt_index = 0

    for index_url in index_urls:
        print(f"[Index] {index_url}")

        try:
            # 👉 Get all essay links from the list page.
            links = get_jhu_essay_links(index_url)
        except Exception as e:
            print(f"  Failed to fetch index page: {e}")
            continue

        print(f"  Found {len(links)} potential essay URLs")

        # Parse each essay page one by one.
        for url in links:
            print(f"    Fetching essay: {url}")
            try:
                essay = parse_jhu_essay(url)

                # 👉 Filter out extremely short pages (not real essays).
                if len(essay["content"]) > 300:
                    if prompt_index < len(prompt_by_essay):
                        essay["topic"] = prompt_by_essay[prompt_index]
                    prompt_index += 1

                    # Put id first in the dictionary
                    format_essay = {"id": f"essay_{next(counter):04d}", **essay}
                    all_essays.append(format_essay)
            except Exception as e:
                print(f"      Failed: {e}")

            # 👉 Sleep to avoid overloading the website.
            time.sleep(0.1)

    # 👉 Save to JSONL format (one JSON per line).
    with open(output_path, "w", encoding="utf-8") as f:
        for essay in all_essays:
            f.write(json.dumps(essay, ensure_ascii=False) + "\n")

    print(f"✅ Saved {len(all_essays)} essays to jhu_essays.jsonl")


# 👉 Standard Python pattern:
#    Run the crawler only when this file is executed directly.
#    Importing it from another file will NOT trigger crawling.
if __name__ == "__main__":
    crawl_jhu_essays()