import requests
import json
import time

def check_browserless():
    print("Checking /json/version...")
    try:
        r = requests.get("http://localhost:3000/json/version")
        print("Version:", json.dumps(r.json(), indent=2))
    except Exception as e:
        print("Version Error:", e)

    print("\nChecking /json/list...")
    try:
        r = requests.get("http://localhost:3000/json/list")
        print("List:", json.dumps(r.json(), indent=2))
    except Exception as e:
        print("List Error:", e)

if __name__ == "__main__":
    check_browserless()
