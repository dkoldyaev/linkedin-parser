import asyncio
from backend.llm import analyze_vacancy_with_llm
from backend.database import SessionLocal
import sys
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    db = SessionLocal()
    res = await analyze_vacancy_with_llm(
        title="https://www.upwork.com/jobs/~01abc123",
        company="Upwork",
        location="Worldwide",
        description="скопируйте текст вручную: Cmd+A Cmd+C Cmd+V и нажмите перегенерировать AI",
        provider="gemini",
        language="ru",
        db=db,
        user_id=1
    )
    print("Result:", res)
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
