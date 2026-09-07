import urllib.request
import json

key = "nOKbvR0ZFtGuOGLZAG22eiDD5QP07p1O"
for model in ["open-mistral-7b", "open-mistral-nemo", "ministral-8b-latest"]:
    req = urllib.request.Request(
        "https://api.mistral.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        data=json.dumps({"model": model, "messages": [{"role": "user", "content": "hi"}]}).encode("utf-8")
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Model {model}: SUCCESS {resp.status}")
    except urllib.error.HTTPError as e:
        print(f"Model {model}: HTTP {e.code} - {e.read().decode('utf-8')[:120]}")
