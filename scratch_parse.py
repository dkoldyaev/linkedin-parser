from bs4 import BeautifulSoup
import re

with open("upwork.html", "r") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

# Salary / Job type
# Upwork features are usually in a list
features = soup.find_all("li", attrs={"data-v-37a24751": True}) or soup.find_all("li", class_=lambda c: c and "features" in c)
# Let's just find list items containing strong text with $
salary_min = None
salary_max = None
salary_period = "hour"
job_type = "Hourly"

# Look for strong tags with $
strongs = soup.find_all("strong")
for s in strongs:
    text = s.get_text(strip=True)
    if "$" in text:
        print(f"Found strong with $: {text}")

# Look for tags (Skills)
# Usually in spans inside something like air3-token
skills = []
tokens = soup.find_all(class_=lambda c: c and "token" in c.lower())
for token in tokens:
    span = token.find("span") or token
    text = span.get_text(strip=True)
    if text and text not in skills and len(text) < 40 and not text.startswith("<"):
        skills.append(text)

print(f"Skills: {skills[:20]}")

# Looking for clock-timelog or fixed-price
for li in soup.find_all("li"):
    text = li.get_text(separator=" ", strip=True)
    if "$" in text:
        print(f"LI with $: {text}")
