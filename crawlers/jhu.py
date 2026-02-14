import time
import json
import requests
from bs4 import BeautifulSoup
from itertools import count
from pathlib import Path
from common import fetch_html

script_dir = Path(__file__).parent
output_path = script_dir / "../data/finalized_data_json/jhu_essays.jsonl"


"""
Extract all essay URLs from a Johns Hopkins 'Essays That Worked' index page.
- index_url: URL of the listing page.
- Returns: list of essay URLs (strings).
"""
def get_jhu_essay_links(index_url): #John Hopkins Essay
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

    # 👉 The main title is usually inside the <h1> tag.
    title_tag = soup.find("h1")
    title = title_tag.get_text().strip() if title_tag else ""

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

    # 👉 Attempt to locate author information.
    author = ""
    date = ""
    author_tag = soup.find(attrs={"class": lambda c: c and "author" in c.lower()})
    if author_tag:
        author = author_tag.get_text().strip()

    # 👉 Attempt to extract <time> tag for dates.
    date_tag = soup.find("time")
    if date_tag:
        date = date_tag.get_text().strip()

    return {
        "topic": title, 
        "content": body_text,
        "type": "personal statement",
        "author": author,
        "url": "online",
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