import json

file = "C:/Users/USER/Desktop/Essay-annotator/shemmassian_college_essays.jsonl"

with open(file, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i == 0:  # print the first essay only
            data = json.loads(line)
            print("TITLE:", data["label"])
            print("URL:", data["url"])
            print("TEXT PREVIEW:\n", data["text"][:500], "...")
            break
