import asyncio
from selenium_driverless import webdriver
import random

async def fetch_upwork_html(url: str):
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    
    width = random.randint(1366, 1920)
    height = random.randint(768, 1080)
    options.add_argument(f"--window-size={width},{height}")

    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ]
    options.add_argument(f"--user-agent={random.choice(user_agents)}")
    
    async with webdriver.Chrome(options=options) as driver:
        await driver.get(url, wait_load=False)
        
        print("Waiting for page...")
        # Check title repeatedly
        for i in range(15):
            await asyncio.sleep(2)
            # Smooth mouse movement
            start_x, start_y = random.randint(100, 800), random.randint(100, 800)
            dest_x, dest_y = random.randint(100, 800), random.randint(100, 800)
            steps = random.randint(15, 30)
            for step in range(steps):
                x = start_x + (dest_x - start_x) * (step / steps)
                y = start_y + (dest_y - start_y) * (step / steps)
                await driver.pointer.move(int(x), int(y))
                await asyncio.sleep(random.uniform(0.01, 0.05))
            title = await driver.title
            print(f"[{i}] Title:", title)
            if "Upwork" in title and "Cloudflare" not in title and "Just a moment" not in title:
                break
                
        html = await driver.execute_script("return document.documentElement.outerHTML")
        with open("upwork_debug.html", "w") as f:
            f.write(html)
        print("Done. Saved to upwork_debug.html")

if __name__ == "__main__":
    url = "https://www.upwork.com/jobs/~022103578583354706485"
    asyncio.run(fetch_upwork_html(url))
