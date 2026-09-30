from bs4 import BeautifulSoup

for filename in ["examples/geekjob.ru.html", "examples/geekjob.ru-2.html"]:
    soup = BeautifulSoup(open(filename).read(), "html.parser")
    print(f"\n{'='*20} {filename} {'='*20}")
    canonical = soup.find("link", rel="canonical")
    print("canonical:", canonical.get("href") if canonical else None)
    
    h1 = soup.find("h1")
    print("H1:", h1.get_text(" ", strip=True) if h1 else None)
    
    # Check meta tags
    og_title = soup.find("meta", property="og:title")
    og_desc = soup.find("meta", property="og:description")
    print("og:title:", og_title.get("content") if og_title else None)
    print("og:description:", og_desc.get("content")[:100] if og_desc else None)
    
    # Check company
    comp = soup.select_one('.company, [class*="company"], .employer')
    print("comp:", comp.get_text(" ", strip=True) if comp else None)
    
    # Check salary
    sal = soup.select_one('.salary, [class*="salary"]')
    print("salary:", sal.get_text(" ", strip=True) if sal else None)
    
    # Check location
    loc = soup.select_one('.location, [class*="location"]')
    print("location:", loc.get_text(" ", strip=True) if loc else None)
    
    # Check description
    desc = soup.select_one('#vacancy-description, .description, [class*="description"]')
    print("desc:", desc.get_text(" ", strip=True)[:100] if desc else None)
    
    # Check closed status
    # Look for archive / closed badge
    closed_badge = soup.select_one('.badge-closed, .status-closed, [class*="closed"], [class*="archive"]')
    print("closed badge:", closed_badge.get_text(strip=True) if closed_badge else None)
