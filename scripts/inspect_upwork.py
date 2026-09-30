from bs4 import BeautifulSoup

soup = BeautifulSoup(open("examples/upwork-2.html").read(), "html.parser")
client_block = soup.select_one(".cfe-ui-job-about-client")
if client_block:
    for li in client_block.find_all("li"):
        print("client li:", repr(li.get_text(" ", strip=True)))
        for s in li.find_all("strong"):
            print("   strong:", repr(s.get_text(strip=True)))

print("\n--- RATES ---")
for li in soup.find_all("li"):
    t = li.get_text(" ", strip=True)
    if any(k in t for k in ["Hourly", "Fixed-price"]) and "$" in t:
        print("rate li:", repr(t))
