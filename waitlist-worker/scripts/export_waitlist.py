#!/usr/bin/env python3
"""Convert Wrangler D1 JSON query output to a launch-notice CSV."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from calendar import monthrange
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def find_result_rows(value: Any) -> list[dict[str, Any]] | None:
    """Find a Wrangler result set while tolerating envelope shape changes."""
    if isinstance(value, dict):
        rows = value.get("results")
        if isinstance(rows, list) and all(isinstance(row, dict) for row in rows):
            return rows
        for nested in value.values():
            found = find_result_rows(nested)
            if found is not None:
                return found
    elif isinstance(value, list):
        for nested in value:
            found = find_result_rows(nested)
            if found is not None:
                return found
    return None


def is_within_retention(consented_at: Any, now: datetime | None = None) -> bool:
    if not isinstance(consented_at, str):
        return False
    try:
        timestamp = datetime.fromisoformat(consented_at.replace("Z", "+00:00"))
    except ValueError:
        return False
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    current = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    cutoff_year = current.year - 1
    cutoff_day = min(current.day, monthrange(cutoff_year, current.month)[1])
    cutoff = current.replace(year=cutoff_year, day=cutoff_day)
    return timestamp.astimezone(timezone.utc) > cutoff


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="CSV destination path")
    args = parser.parse_args()

    try:
        response = json.load(sys.stdin)
    except json.JSONDecodeError as error:
        print(f"Could not read Wrangler JSON: {error}", file=sys.stderr)
        return 2

    rows = find_result_rows(response)
    if rows is None:
        print("Wrangler JSON did not contain a D1 result set.", file=sys.stderr)
        return 2

    # Never export entries already marked as notified, even if the caller's
    # query accidentally returned more than the active launch list.
    active_rows = [
        row for row in rows
        if row.get("launch_notice_sent_at") in (None, "")
        and isinstance(row.get("email"), str)
        and is_within_retention(row.get("consented_at"))
    ]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8-sig", newline="") as output_file:
        writer = csv.DictWriter(output_file, fieldnames=("email", "consented_at", "source"))
        writer.writeheader()
        for row in active_rows:
            source = row.get("source")
            writer.writerow({
                "email": row["email"],
                "consented_at": row["consented_at"],
                "source": source if isinstance(source, str) else "",
            })

    print(f"Exported {len(active_rows)} active waitlist address(es) to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
