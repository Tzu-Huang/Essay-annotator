"""Eligibility masking for search.

Kept free of app state and I/O so the privacy rules can be unit-tested
directly. The mask decides which index rows are allowed to be *ranked* --
filtering after Top-K would let ineligible essays consume result slots
(ZAC-104) and, worse, be returned at all (ZAC-102).
"""
from __future__ import annotations

import numpy as np

# Sentinel accepted by the API meaning "do not filter by type".
ALL_TYPES = "all"


def build_eligibility_mask(
    public: list[bool],
    deleted: list[bool],
    types: list[str],
    essay_types: list[str] | None,
) -> np.ndarray:
    """Return a bool mask over index rows: True = may be ranked and returned.

    A row is eligible when it is published, not soft-deleted, and matches the
    requested essay types. Flag lists shorter than `types` fail closed -- a row
    with no known visibility is treated as private.
    """
    n = len(types)
    mask = np.zeros(n, dtype=bool)
    for i in range(n):
        is_public = public[i] if i < len(public) else False
        is_deleted = deleted[i] if i < len(deleted) else False
        mask[i] = bool(is_public) and not bool(is_deleted)

    if essay_types and ALL_TYPES not in essay_types:
        wanted = set(essay_types)
        type_ok = np.array([t in wanted for t in types], dtype=bool)
        mask &= type_ok

    return mask
