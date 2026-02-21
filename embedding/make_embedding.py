# Name: Zackery Liu
# Input: JSONL file that contains fields such as
#        id, topic, content, type, school, public, source_file
# Output: Export a new JSONL file ('embed.jsonl') where each record
#         includes embedding vectors for both topic and content

"""
This program reads a finalized JSONL corpus, extracts text fields,
generates OpenAI embeddings in batches, and writes the enriched
records (with embeddings) back to a JSONL output file.
"""

import os
import json
from pathlib import Path
from openai import OpenAI  

# =========================
# Config
# =========================

# Input JSONL file (finalized schema)
Input_file = 'data/finalized_data_jsonl/database.jsonl'
Output_file = 'data/embed_output/embed.jsonl'

Batch_size = 64 # This is the size that you want to embed and store at once

# =========================
# Helper functions
# =========================

def read_jsonl(path):
    """
    Read a JSONL file line by line.
    Each line should be a valid JSON object.
    
    Yield: dict (one record per line)
    """
    with open(path, "r", encoding="utf-8-sig") as f:
        for idx, line in enumerate(f, start=1):
            line = line.strip()

            # Skip empty lines
            if not line:
                continue

            try:
                obj = json.loads(line)
                # print("obj in read_jsonl(): ")
                yield obj # Yield one record at a time for streaming processing


            except json.JSONDecodeError as e:
                # Very important for debugging bad lines
                print(f"[JSON ERROR] line {idx}: {e}")
                print("Preview:", line[:120])

def load_processed_ids(output_path: str) -> set:
    """
    Read exisiting output JSONL (embed.jsonl) and collect processed records IDs
    """

    processed = set()

    if not os.path.exists(output_path):
        return processed

    with open(output_path, "r", encoding="utf-8-sig") as f:
        for idx, line in enumerate(f, start= 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                rid = obj.get("id")
                if rid:
                    processed.add(rid)
            except Exception as e:
                print(e)
    return processed

def extract_text_fields(obj):
    """
    Given one JSON object, extract topic and content.
    Return None if required fields are missing.
    """
    topic = obj.get("topic")
    content = obj.get("content")

    if topic is None or content is None:
        return None

    # Basic cleanup (important before embedding)
    topic = topic.strip()
    content = content.strip()

    if not topic or not content:
        return None

    return {
        "id": obj.get("id"),
        "topic": topic,
        "content": content,
        "type": obj.get("type"),
        "school": obj.get("school"),
        "public": obj.get("public"),
        "source_file": obj.get("source_file"),
    }

def embedding(client, text):
    """
    input: array (list[str])
    output: vectors
    """
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input= text
    )
    return [item.embedding for item in response.data]


# =========================
# Main logic
# =========================

def main():

    # LOADING
    try:
        print("Loading data from JSONL...\n")

        client = OpenAI(api_key = os.environ["OPENAI_API_KEY"])
        os.makedirs(os.path.dirname(Output_file), exist_ok=True)
    except:
        print("Unexpected issue happened during the loading process")
        return

    batch_records = []   # list[dict]
    batch_topics = []    # list[str]
    batch_contents = []  # list[str]

    total_written = 0
    total_seen = 0
    total_skipped = 0

    seen_ids = load_processed_ids(Output_file) # Check load status
    print(f"Found {len(seen_ids)} already embedded records in output")

    # We use "a" instead of "w" because we only need to append instead of rewite
    with open(Output_file, "a", encoding="utf-8-sig") as out:

        # Step 1: read jsonl line by line
        for obj in read_jsonl(Input_file):
            total_seen += 1

            record = extract_text_fields(obj)
            if record is None:
                continue
            
            rid = record.get("id")
            if not rid:
                continue
            
            if rid in seen_ids:
                total_skipped += 1
                continue
            batch_records.append(record)
            batch_topics.append(record["topic"])
            batch_contents.append(record["content"])

            # When batch is full, do embedding and output
            if (len(batch_records) >= Batch_size):
                print("records >= Batch size! Embedding now")
                try:
                    topic_vecs = embedding(client, batch_topics)
                    content_vecs = embedding(client, batch_contents)
                except Exception as e:
                    print(e)
                    print("Batch Size: ", len(batch_records))

                    # Clear batch to avoid crash
                    batch_records.clear()
                    batch_topics.clear()
                    batch_contents.clear()
                    continue

                for rec, tvec, cvec in zip(batch_records, topic_vecs, content_vecs):
                    # rec: record, tvec: topic_vector, cvec: content_vec
                    rec["topic_embedding"] = tvec
                    rec["content_embedding"] = cvec

                    # Convert a complete record to a line and store in embed.jsonl
                    out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                    seen_ids.add(rec["id"])

                total_written += len(batch_records)
                print(f"Written {total_written} records.. ")

                # Clear batch
                batch_records.clear()
                batch_topics.clear()
                batch_contents.clear()

        # This is for the case when there are no enough batch_recrods that is >= 64
        if batch_records:
            topic_vecs = embedding(client, batch_topics)
            content_vecs = embedding(client, batch_contents)

            for rec, tvec, cvec in zip(batch_records, topic_vecs, content_vecs):
                # rec: record, tvec: topic_vector, cvec: content_vec
                rec["topic_embedding"] = tvec
                rec["content_embedding"] = cvec

                # Convert a complete record to a line and store in embed.jsonl
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                seen_ids.add(rec["id"])

            total_written += len(batch_records)
            print(f"Written {total_written} records.. ")

            # Clear batch
            batch_records.clear()
            batch_topics.clear()
            batch_contents.clear()

    print("\n DONE! ")
    print(f"Total seen lines: {total_seen}")
    print(f"Total embedded+written: {total_written}")
    print(f"Total skipped (already embedded): {total_skipped}")
    print(f"Output: {Output_file}")

if __name__ == "__main__":
    main()
