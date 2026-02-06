from pathlib import Path
from itertools import count
import json
import re

script_dir = Path(__file__).parent
input_dir = script_dir / "../data/organized_data/supplementals/"
output_path = script_dir / "../data/finalized_data_json/supplementals.jsonl"