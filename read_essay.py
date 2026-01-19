import json

file = "C:/Users/USER/Desktop/Essay-annotator/data/essays_json/essays.json"

with open(file, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i == 0:  # print the first essay only
            data = json.loads(line)
            print("TITLE:", data["id"])
            #print("URL:", data["url"])
            print("TEXT PREVIEW:\n", data["text"][:500], "...")
            break
