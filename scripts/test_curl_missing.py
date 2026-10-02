#!/usr/bin/env python3
import re
import subprocess
from pathlib import Path

tests = [
    ("career.habr.com.html", r'https://career\.habr\.com/[^\s"\'><]+'),
    ("glassdoor.html",        r'https://www\.glassdoor\.[a-z]+/job[^\s"\'><]+'),
    ("upwork.html",           r'https://www\.upwork\.com/jobs/[^\s"\'><]+'),
]

HEADERS = (
    "-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' "
    "-H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' "
    "-H 'Accept-Language: ru,en;q=0.9' "
    "-H 'Accept-Encoding: gzip, deflate, br'"
)

BLOCK_SIGNALS = [
    "cf-browser-verification", "cloudflare", "g-recaptcha", "h-captcha",
    "datadome", "turnstile", "just a moment", "access denied", "captcha",
    "authwall", "robot", "human verification", "challenge",
    "security check", "attention required",
]

print()
for fname, pattern in tests:
    p = Path("examples") / fname
    text = p.read_text(errors="ignore")
    m = re.search(pattern, text)
    if not m:
        print(f"{fname}: URL NOT FOUND in file")
        continue
    url = m.group(0).split('"')[0].split("'")[0].rstrip("\\")[:200]
    print(f"\n{fname}")
    print(f"  URL: {url}")
    
    cmd = (
        f"curl -sL --compressed --max-time 20 "
        f"-o /tmp/_curl_out -w '%{{http_code}} %{{size_download}}' "
        f"{HEADERS} '{url}'"
    )
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=25)
        parts = result.stdout.strip().split()
        status = parts[0] if parts else "?"
        size   = int(parts[1]) if len(parts) > 1 else 0
        content = Path("/tmp/_curl_out").read_text(errors="ignore").lower() if Path("/tmp/_curl_out").exists() else ""
        blocked = any(s in content for s in BLOCK_SIGNALS) or status in ("403","429","503","401")
        title_m = re.search(r"<title[^>]*>([^<]{1,100})</title>", content, re.IGNORECASE)
        title = title_m.group(1).strip()[:80] if title_m else "—"
        print(f"  Status: {status}  Size: {size}  {'🚫 BLOCKED' if blocked else '✓ accessible'}")
        print(f"  Title: {title}")
    except subprocess.TimeoutExpired:
        print(f"  ⏱ TIMEOUT")
    except Exception as e:
        print(f"  ✗ {e}")
print()
