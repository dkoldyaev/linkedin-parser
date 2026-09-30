import asyncio
import json
import sys
from pathlib import Path
from bs4 import BeautifulSoup
from backend.parsers import registry
from backend.parsers.types import VacancyData

# All 17 canonical fields of VacancyData
ALL_FIELDS = [
    "url",
    "source",
    "job_id",
    "title",
    "company",
    "company_url",
    "company_info",
    "location",
    "city",
    "country",
    "workplace_type",
    "salary_min",
    "salary_max",
    "salary_currency",
    "salary_period",
    "is_closed",
    "description",
]

def format_cell(val, max_len=25):
    if val is None:
        return "-"
    if isinstance(val, bool):
        return "True" if val else "False"
    s = str(val).replace("\n", " ").replace("\r", " ").replace("|", "/").strip()
    if len(s) > max_len:
        return s[:max_len - 3] + "..."
    return s

async def main():
    examples_dir = Path("examples")
    files = sorted(list(examples_dir.glob("*.html")))
    
    records = []
    
    for f in files:
        content = f.read_text(errors="ignore")
        soup = BeautifulSoup(content, "html.parser")
        canonical = soup.find("link", rel="canonical")
        url = canonical.get("href") if canonical else ""
        
        # Ensure url matches the site so parser dispatch succeeds
        if "avito" in f.name and "avito.ru" not in url:
            url = f"https://www.avito.ru/{f.name}"
        elif "career.habr" in f.name and "career.habr.com" not in url:
            url = f"https://career.habr.com/{f.name}"
        elif "fl.ru" in f.name and "fl.ru" not in url:
            url = f"https://www.fl.ru/{f.name}"
        elif "geekjob" in f.name and "geekjob.ru" not in url:
            url = f"https://geekjob.ru/{f.name}"
        elif "glassdoor" in f.name and "glassdoor.com" not in url:
            url = f"https://www.glassdoor.com/job-listing/{f.name}"
        elif "layboard" in f.name and "layboard.com" not in url:
            url = f"https://layboard.com/{f.name}"
        elif "rabota" in f.name and "rabota.ru" not in url:
            url = f"https://www.rabota.ru/{f.name}"
        elif "superjob" in f.name and "superjob.ru" not in url:
            url = f"https://www.superjob.ru/{f.name}"
        elif "upwork" in f.name and "upwork.com" not in url:
            url = f"https://www.upwork.com/jobs/{f.name}"
            
        data = await registry.parse(url, html=content)
        
        record = {
            "_file": f.name,
            **{field: data.get(field) for field in ALL_FIELDS}
        }
        records.append(record)

    # Save full JSON output
    out_dir = Path("results")
    out_dir.mkdir(exist_ok=True)
    json_path = out_dir / "parsed_examples.json"
    with open(json_path, "w", encoding="utf-8") as jf:
        json.dump(records, jf, ensure_ascii=False, indent=2)
    print(f"Saved full JSON for {len(records)} records to {json_path}")

    # Build Markdown table
    headers = ["File"] + ALL_FIELDS
    col_widths = {h: len(h) for h in headers}
    
    rows = []
    for r in records:
        row = [r["_file"]] + [r.get(f) for f in ALL_FIELDS]
        row_str = [format_cell(v, 22) for v in row]
        rows.append(row_str)
        for h, v in zip(headers, row_str):
            col_widths[h] = max(col_widths[h], len(v))

    header_line = "| " + " | ".join(h.ljust(col_widths[h]) for h in headers) + " |"
    separator_line = "| " + " | ".join("-" * col_widths[h] for h in headers) + " |"
    
    md_lines = [header_line, separator_line]
    for row in rows:
        md_lines.append("| " + " | ".join(v.ljust(col_widths[h]) for h, v in zip(headers, row)) + " |")

    table_md = "\n".join(md_lines)
    
    table_path = out_dir / "parsed_table.md"
    table_path.write_text(table_md, encoding="utf-8")
    print(f"Saved Markdown table to {table_path}\n")
    print(table_md)

if __name__ == "__main__":
    asyncio.run(main())
