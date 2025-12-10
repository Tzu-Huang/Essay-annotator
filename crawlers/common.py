# Avoid being detected as a robot
import requests


HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; EssayCrawler/0.1; +https://example.com/your-contact)"
}

"""
Fetch the HTML content from a given URL.
- Sends an HTTP GET request.
- Handles errors like connection failures or non-200 status codes.
"""
def fetch_html(url):
    resp = requests.get(url, headers=HEADERS, timeout=10) # Sending request
    resp.raise_for_status()    
    return resp.text 