import asyncio
from selenium_driverless import webdriver
from selenium_driverless.types.by import By

async def main():
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless=new")
    async with webdriver.Chrome(options=options) as driver:
        await driver.get("https://www.upwork.com/jobs/~022103578583354706485", wait_load=True)
        # Cloudflare might take a few seconds
        await asyncio.sleep(5)
        html = await driver.execute_script("return document.documentElement.outerHTML")
        with open("upwork.html", "w") as f:
            f.write(html)
        print("Success! Wrote upwork.html")

asyncio.run(main())
