from bs4 import BeautifulSoup
import json
from pathlib import Path

for f in sorted(Path("examples").glob("avito*.html")):
    soup = BeautifulSoup(f.read_text(errors="ignore"), "html.parser")
    jlds = soup.find_all("script", type="application/ld+json")
    print(f"\n{f.name}: {len(jlds)} json-ld scripts")
    for j in jlds:
        try:
            d = json.loads(j.string)
            print("  @type:", d.get("@type"))
            if d.get("@type") == "JobPosting":
                print("   title:", d.get("title"))
                print("   hiringOrg:", d.get("hiringOrganization"))
                print("   jobLocation:", d.get("jobLocation"))
                print("   baseSalary:", d.get("baseSalary"))
        except Exception as e:
            print("  err:", e)
