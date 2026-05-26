import csv
import io
import re
from typing import List, Dict


def parse_csv(content: str) -> List[Dict]:
    """Parse CSV content to list of dicts. Must have 'email' column."""
    reader = csv.DictReader(io.StringIO(content.strip()))
    rows = []
    for row in reader:
        row = {k.strip(): v.strip() for k, v in row.items() if k}
        if "email" in row and row["email"]:
            rows.append(row)
    return rows


def substitute_variables(template: str, contact: Dict) -> str:
    """Replace {{variable}} placeholders with contact data."""
    def replacer(match):
        key = match.group(1).strip()
        return contact.get(key, match.group(0))  # Keep original if key missing

    return re.sub(r"\{\{(\w+)\}\}", replacer, template)
