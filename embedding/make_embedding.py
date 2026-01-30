import os, json
from pathlib import Path
from openai import OpenAI

# file_path: finalized_data_json
file_path = 'data/finalized_data_json/corpus.jsonl'

try:
    with open(file_path, 'r', encoding= "utf-8-sig") as file:
        data = file.read()
        # data = json.load(file)
        print("OK")
        print("Data loading...\n", data[:50])
except FileNotFoundError:
    print(f"Error: the file '{file_path}' was not found.")
except Exception as e:
    print("An exception occured: ", e)
