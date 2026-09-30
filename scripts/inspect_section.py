import sys
import re
from pathlib import Path
from bs4 import BeautifulSoup

section = sys.argv[1] if len(sys.argv) > 1 else "avito"
print(f"=== SECTION: {section} ===")

pattern_map = {
    "avito": "avito*.html",
    "fl": "fl.ru*.html",
    "rabota": "rabota.ru*.html",
    "upwork": "upwork*.html",
    "geekjob": "geekjob.ru*.html"
}

files = sorted(list(Path("examples").glob(pattern_map.get(section, f"{section}*.html"))))

for p in files:
    soup = BeautifulSoup(p.read_text(errors="ignore"), "html.parser")
    print(f"\n--- {p.name} ---")
    
    if section == "avito":
        h1 = soup.find("h1")
        # Find seller:
        seller_link = soup.select_one('[data-marker="seller-link/link"], [data-marker="seller-info/name"], a[href*="/user/"]')
        # Address:
        addr = soup.select_one('[itemprop="address"], [class*="style-item-address__string"], span[class*="address"]')
        # Salary:
        price = soup.select_one('[data-marker*="price"], [class*="price-value"]')
        # Closed:
        closed = bool(soup.select_one('[data-marker="item-closed-banner"], [class*="item-view-closed"]') or 
                      soup.find(string=re.compile(r"объявление снято|снято с публикации", re.I)))
        desc = soup.select_one('[data-marker="item-description/text"]')
        print(f"  Title: {h1.get_text(' ', strip=True) if h1 else None}")
        print(f"  Seller: {seller_link.get_text(' ', strip=True) if seller_link else None}")
        print(f"  Address: {addr.get_text(' ', strip=True) if addr else None}")
        print(f"  Price: {price.get_text(' ', strip=True) if price else None}")
        print(f"  Closed: {closed}")
        print(f"  Desc: {desc.get_text(' ', strip=True)[:100] if desc else None}")

    elif section == "fl":
        h1 = soup.find("h1")
        # Find price / budget
        cost_el = soup.find(id=re.compile(r"cost", re.I)) or soup.select_one('.b-layout__txt_fontsize_18, [class*="cost"]')
        # Let's inspect all elements with price/currency:
        prices = [el.get_text(strip=True) for el in soup.find_all(string=re.compile(r"₽|руб|\$|EUR|По договоренности", re.I))[:10]]
        emp = soup.select_one('.b-layout__author, a[href^="/users/"]')
        desc = soup.select_one('#projectp, [id^="project-description"]')
        closed = bool(soup.find(string=re.compile(r"заказ закрыт|проект закрыт|завершен|в архиве", re.I)))
        print(f"  Title: {h1.get_text(' ', strip=True) if h1 else None}")
        print(f"  Cost el: {cost_el.get_text(' ', strip=True) if cost_el else None}")
        print(f"  Prices text: {prices[:5]}")
        print(f"  Employer: {emp.get_text(' ', strip=True) if emp else None} (href={emp.get('href') if emp else None})")
        print(f"  Desc: {desc.get_text(' ', strip=True)[:100] if desc else None}")
        print(f"  Closed: {closed}")

    elif section == "rabota":
        h1 = soup.find("h1")
        # In rabota.ru, let's find company name:
        comp_el = soup.select_one('a[href*="/company/"], [itemprop="name"]')
        # Also check all links:
        comp_links = [a.get_text(strip=True) for a in soup.select('a[href*="/company/"]')]
        sal = soup.select_one('[class*="salary"], [itemprop="baseSalary"]')
        # Location:
        loc = soup.select_one('[class*="location"], [itemprop="jobLocation"], [class*="address"]')
        locs = [el.get_text(strip=True) for el in soup.select('[class*="location"], [class*="address"], [class*="city"]')]
        desc = soup.select_one('[itemprop="description"], [class*="vacancy-description"], [class*="description"]')
        print(f"  Title: {h1.get_text(' ', strip=True) if h1 else None}")
        print(f"  Comp: {comp_links}")
        print(f"  Salary: {sal.get_text(' ', strip=True) if sal else None}")
        print(f"  Locs: {locs[:5]}")
        print(f"  Desc: {desc.get_text(' ', strip=True)[:100] if desc else None}")

    elif section == "upwork":
        h4 = soup.find("h4")
        title = soup.find("title").get_text(strip=True) if soup.find("title") else ""
        # Upwork description:
        desc_el = soup.select_one('[data-test="JobDescription"], [data-test="job-description-text"], .up-card-section')
        # Let's inspect sections in upwork:
        sections = [s.get_text(" ", strip=True)[:100] for s in soup.select('section, .up-card-section')[:5]]
        # Location:
        loc = soup.find(string=re.compile(r"Location|Client country|United States|Germany|United Kingdom", re.I))
        # Budget:
        budget = soup.find(string=re.compile(r"\$\d+|\d+\/hr", re.I))
        print(f"  Title (h4): {h4.get_text(' ', strip=True) if h4 else None}")
        print(f"  Title (tag): {title}")
        print(f"  Sample sections: {sections[:2]}")
        print(f"  Found budget text: {budget}")
        print(f"  Found loc text: {loc}")
