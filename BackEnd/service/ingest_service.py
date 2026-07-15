from itertools import count
from pathlib import Path

from scripts.add_to_database import add_generated_titles, get_next_id, load_existing_signatures, load_new_input_essays


def scan_and_title_new_essays(new_input_dir: Path, database_path: Path, client) -> list[dict]:
    """
    Scan new_input_dir for .txt files, parse topic/content, dedupe against
    database_path's existing signatures, generate titles via the LLM, and
    return the resulting essay dicts. Does not write database.jsonl itself --
    callers (CLI script, import endpoint) own that.

    Note: this does NOT leave source files untouched. load_new_input_essays
    physically moves each successfully-scanned .txt file into
    new_input/processed/ as a side effect -- that move happens as part of
    this call, not something callers opt into separately.
    """
    existing_signatures = load_existing_signatures(database_path)
    id_counter = count(get_next_id(database_path))
    # load_new_input_essays moves each scanned source file into new_input/processed/
    # internally (see move_processed_file) -- this wrapper doesn't control that side
    # effect. Task 10 always commits right after scanning, so it's a non-issue today,
    # but a future "preview import, then confirm or cancel" caller would need to
    # account for files already having moved before any "confirm" step runs.
    new_essays = load_new_input_essays(id_counter, existing_signatures, new_input_dir)
    add_generated_titles(new_essays, client)
    return new_essays
