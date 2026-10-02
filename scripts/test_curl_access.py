#!/usr/bin/env python3
"""
Extract one canonical URL per site from examples/, then curl each one
and report: HTTP status, response size, and whether it looks like a captcha/block.
"""

import re
import subprocess
from pathlib import Path

examples = Path("examples")
canonical_re = re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', re.IGNORECASE)
og_url_re    = re.compile(r'property=["\']og:url["\'][^>]*content=["\']([^"\']+)["\']', re.IGNORECASE)

BLOCK_SIGNALS = [
    "cf-browser-verification", "cloudflare ray id", "cf_challenge",
    "g-recaptcha", "h-captcha", "datadome", "px-captcha",
    "turnstile", "just a moment", "access denied", "captcha",
    "authwall", "robot", "human verification", "challenge",
    "security check", "interstitial", "attention required",
    "перейти к объявлению", "подтвердите", "подтверждение",
]

def site_key(fname: str) -> str:
    # strip trailing -2, -3 etc and .html
    name = fname.replace(".html", "")
    name = re.sub(r"-\d+$", "", name)
    return name

urls: dict[str, str] = {}
for f in sorted(examples.glob("*.html")):
    key = site_key(f.name)
    if key in urls:
        continue
    # read full file for URL extraction
    text = f.read_text(errors="ignore")
    m = canonical_re.search(text) or og_url_re.search(text)
    if m:
        urls[key] = m.group(1)
    else:
        # fallback: mark as found but no URL
        urls[key] = None

HEADERS = (
    "-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' "
    "-H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' "
    "-H 'Accept-Language: ru,en;q=0.9' "
    "-H 'Accept-Encoding: gzip, deflate, br'"
)

print(f"\n{'SITE':<25} {'STATUS':>6} {'SIZE':>9}  RESULT")
print("─" * 65)

for key, url in sorted(urls.items()):
    if url is None:
        print(f"{key:<25} {'N/A':>6}   no canonical URL found in file")
        continue

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

        p = Path("/tmp/_curl_out")
        content = p.read_text(errors="ignore").lower() if p.exists() else ""
        blocked = any(s in content for s in BLOCK_SIGNALS)
        if not blocked and status in ("403", "429", "503", "401"):
            blocked = True

        title_m = re.search(r"<title[^>]*>([^<]{1,120})</title>", content, re.IGNORECASE)
        title = title_m.group(1).strip()[:75] if title_m else "—"

        if blocked or size < 3000:
            flag = "🚫 BLOCKED"
        else:
            flag = "✓ accessible"

        print(f"{key:<25} {status:>6} {size:>9}  {flag}")
        print(f"  url:   {url[:80]}")
        print(f"  title: {title}")
    except subprocess.TimeoutExpired:
        print(f"{key:<25} {'TIMEOUT':>6}            ⏱ no response in 20s")
    except Exception as e:
        print(f"{key:<25} {'ERR':>6}            ✗ {e}")

print()
