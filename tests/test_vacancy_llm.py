import asyncio
from backend.scraper import scrape_linkedin_job
from backend.llm import analyze_vacancy_with_llm

async def main():
    url = "https://www.linkedin.com/jobs/view/4409263207/"
    print("Scraping vacancy...")
    scraped = await scrape_linkedin_job(url)
    print(f"Scraped title: {scraped['title']} | company: {scraped['company']} | location: {scraped['location']}")
    
    print("\nCalling Mistral AI...")
    llm_res = await analyze_vacancy_with_llm(
        title=scraped["title"],
        company=scraped["company"],
        location=scraped["location"],
        description=scraped["description"],
        provider="mistral",
        language="ru",
    )
    
    print("\nMISTRAL AI RESULT:")
    print("Summary:", llm_res.get("summary"))
    print("Tech Stack:", llm_res.get("tech_stack"))
    print("Company Info:", llm_res.get("company_info"))
    print("AI Error:", llm_res.get("ai_error"))

if __name__ == "__main__":
    asyncio.run(main())
