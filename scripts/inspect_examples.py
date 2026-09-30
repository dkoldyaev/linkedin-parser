import re
from pathlib import Path
from bs4 import BeautifulSoup

# 1. AVITO
print("=== AVITO DETAILS ===")
for p in Path("examples").glob("avito*.html"):
    soup = BeautifulSoup(p.read_text(errors="ignore"), "html.parser")
    # Company
    seller = soup.select_one('[data-marker="seller-info/label"], [data-marker="seller-link/link"], [class*="SellerInfo-name"], [class*="seller-info-name"]')
    seller_name = seller.get_text(" ", strip=True) if seller else None
    
    # Address
    geo = soup.select_one('[class*="style-item-address__string"], [data-marker="delivery/location"], [itemprop="address"], span[class*="address"]')
    geo_name = geo.get_text(" ", strip=True) if geo else None
    
    # Closed banner
    closed_banner = soup.select_one('[class*="closed"], [data-marker="item-closed-banner"], [class*="item-view-closed"]')
    closed_text = soup.find(string=re.compile(r"снято с публикации|закрыто|объявление закрыто", re.I))
    
    # Description
    desc = soup.select_one('[data-marker="item-description/text"], [itemprop="description"]')
    
    print(f"{p.name}:")
    print(f"  seller: {seller_name}")
    print(f"  geo: {geo_name}")
    print(f"  closed: {bool(closed_banner or closed_text)}")
    print(f"  desc length: {len(desc.get_text(strip=True)) if desc else 0}")

# 2. FL.RU
print("\n=== FL.RU DETAILS ===")
for p in Path("examples").glob("fl.ru*.html"):
    soup = BeautifulSoup(p.read_text(errors="ignore"), "html.parser")
    # Cost
    cost = soup.select_one('[class*="cost"], [id*="cost"], .b-layout__txt_fontsize_18, .text-cost')
    all_costs = [el.get_text(" ", strip=True) for el in soup.select('[class*="cost"], [class*="price"], .b-layout__txt_fontsize_18')]
    # Employer
    emp = soup.select_one('a[href^="/users/"], .b-layout__author')
    # Desc
    desc = soup.select_one('#projectp, [id^="project-description"], [class*="project-description"]')
    # Status
    status = soup.select_one('.b-layout__txt_color_6db335, .text-success, [class*="status"]')
    print(f"{p.name}:")
    print(f"  all costs: {all_costs[:5]}")
    print(f"  emp: {emp.get_text(' ', strip=True) if emp else None} (href={emp.get('href') if emp else None})")
    print(f"  desc: {desc.get_text(' ', strip=True)[:80] if desc else None}")
    print(f"  status: {status.get_text(' ', strip=True) if status else None}")

# 3. RABOTA.RU
print("\n=== RABOTA.RU DETAILS ===")
for p in Path("examples").glob("rabota.ru*.html"):
    soup = BeautifulSoup(p.read_text(errors="ignore"), "html.parser")
    # Title
    h1 = soup.find("h1")
    # Company
    comp = soup.select_one('a[href*="/company/"], [itemprop="hiringOrganization"] [itemprop="name"], .vacancy-company-name')
    # Location
    loc = soup.select_one('.vacancy-location, [itemprop="jobLocation"], [class*="location"]')
    # Address
    addr = soup.select_one('[itemprop="address"], [class*="address"]')
    # Description
    desc = soup.select_one('.vacancy-description, [itemprop="description"], [class*="description"]')
    # Closed
    closed = soup.find(string=re.compile(r"вакансия в архиве|вакансия закрыта|в архиве", re.I))
    print(f"{p.name}:")
    print(f"  h1: {h1.get_text(' ', strip=True) if h1 else None}")
    print(f"  comp: {comp.get_text(' ', strip=True) if comp else None}")
    print(f"  loc: {loc.get_text(' ', strip=True) if loc else None}")
    print(f"  addr: {addr.get_text(' ', strip=True) if addr else None}")
    print(f"  desc len: {len(desc.get_text(strip=True)) if desc else 0}")
    print(f"  closed: {bool(closed)}")

# 4. UPWORK
print("\n=== UPWORK DETAILS ===")
for p in Path("examples").glob("upwork*.html"):
    soup = BeautifulSoup(p.read_text(errors="ignore"), "html.parser")
    # Find title
    h4 = soup.find("h4")
    # Find description
    desc = soup.select_one('[data-test="job-description-text"], [itemprop="description"], .text-body-sm')
    # Find job-details or attributes
    badges = [b.get_text(" ", strip=True) for b in soup.select('[data-test*="job-type"], [data-test*="budget"], [data-test*="contractor-tier"], [class*="badge"], [data-test="JobTile"]')]
    client_loc = soup.select_one('[data-test="client-country"], [data-test="client-location"], [itemprop="country-name"]')
    # Look for salary/budget
    budget_els = soup.find_all(string=re.compile(r"\$|\/hr|Fixed-price|Hourly", re.I))
    print(f"{p.name}:")
    print(f"  h4: {h4.get_text(' ', strip=True) if h4 else None}")
    print(f"  sample budget strings: {[s.strip() for s in budget_els[:6] if s.strip()]}")
    print(f"  client loc: {client_loc.get_text(' ', strip=True) if client_loc else None}")
