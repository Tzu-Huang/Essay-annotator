# Name: Amanda
# Input: get the jsonl essay files, collected and web data
# Output: output a single jsonl file that contains ALL the essays we have
#         including online data through beautifulsoup and our user data

"""
This programs reads all the jsonl files of essays from the essays_jsonl folder
and combine each of them into one single JSON string into a huge JSONL file
"""

import json
from pathlib import Path
from itertools import count

# =========================
# Config
# =========================

# Source file
script_dir = Path(__file__).parent
input_dir = script_dir / "../data/essays_jsonl/"
output_path = script_dir / "../data/finalized_data_jsonl/database.jsonl"

# Counter
id_counter = count(1)

# =========================
# Helper methods
# =========================

def read_file(file_path, id_counter):
    """
    This method reads each line in the current essay jsonl file and help record 
    and yield the essay into the output file

    Args:
        file_path: the current essay jsonl 
        id_counter: to keep track and update the essay id 

    Yields: each essay in each file
    """
    with open(file_path, "r", encoding = "utf-8") as file:
        for line in file:

            # Load each essay in the file, each line is a json object
            data = json.loads(line)

            # Handle None values before stripping
            topic = data.get("topic") or ""
            content = data.get("content") or ""
            data["topic"] = topic.strip()
            data["content"] = content.strip()

            if not data.get("topic") or not data.get("content"):
                continue
            
            # Update the id to make them flow together
            data["id"] = f"essay_{next(id_counter):04d}"

            # Yield: a pointer to the data, won't take up memory
            yield data


# =========================
# Main (funciton/logic)
# =========================

def main():
    total_count = 0
    
    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as output:
        for file_path in input_dir.glob("*.jsonl"):

            # debug printing
            print(f"Processing {file_path.name}")

            # read each all the essays in each file and write it to the output
            for essay in read_file(file_path, id_counter):
                output.write(json.dumps(essay, ensure_ascii=False) + "\n")
                total_count += 1    
    print(f"Saved {total_count} essays to finalized_data.jsonl")
        
if __name__ == "__main__":
    main()