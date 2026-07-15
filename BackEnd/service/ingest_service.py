from itertools import count
from pathlib import Path

from scripts.add_to_database import add_generated_titles, get_next_id, load_existing_signatures, load_new_input_essays


def scan_and_title_new_essays(new_input_dir: Path, database_path: Path, client) -> list[dict]:
    """
    Scan new_input_dir for .txt files, parse topic/content, dedupe against
    database_path's existing signatures, generate titles via the LLM, and
    return the resulting essay dicts. Does not write database.jsonl or move
    processed files -- callers (CLI script, import endpoint) own that.
    """
    existing_signatures = load_existing_signatures(database_path)
    id_counter = count(get_next_id(database_path))
    new_essays = load_new_input_essays(id_counter, existing_signatures, new_input_dir)
    add_generated_titles(new_essays, client)
    return new_essays
