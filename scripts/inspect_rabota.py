from bs4 import BeautifulSoup

soup = BeautifulSoup(open("examples/rabota.ru.html").read(), "html.parser")
# Check salary
salary_el = soup.select_one('[class*="salary"], [itemprop="baseSalary"]')
print("salary_el:", salary_el.name, salary_el.get("class"), salary_el.get_text(strip=True))

# Check description
desc_el = soup.select_one('.vacancy-description, [itemprop="description"], .vacancy-card__description')
print("desc_el:", desc_el.name if desc_el else None, desc_el.get("class") if desc_el else None)
if desc_el:
    print("desc sample:", desc_el.get_text("\n", strip=True)[:200])

# Check location
loc_el = soup.select_one('.vacancy-requirements__city, .vacancy-locations__address, [itemprop="jobLocation"]')
print("loc_el:", loc_el.get_text(strip=True) if loc_el else None)
