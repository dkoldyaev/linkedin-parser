"""Scraped vacancy to LLM integration without network access or paid calls."""
import asyncio
import json
from unittest.mock import AsyncMock, patch
from backend.scraper import scrape_linkedin_job
from backend.llm import analyze_vacancy_with_llm


def test_scraped_vacancy_to_llm(monkeypatch):
    html = '''<html><body><h1 class="top-card-layout__title">Python Engineer</h1>
      <a class="topcard__org-name-link">Test Corp</a>
      <span class="topcard__flavor--bullet">Madrid, Spain</span>
      <div class="description__text">Build Python and PostgreSQL services.</div></body></html>'''
    async def scenario():
        scraped = await scrape_linkedin_job('https://www.linkedin.com/jobs/view/12345678/', html=html)
        assert scraped['title'] == 'Python Engineer'
        assert 'PostgreSQL' in scraped['description']
        monkeypatch.setenv('MISTRAL_API_KEY', 'test-only')
        with patch('backend.llm.call_mistral', new_callable=AsyncMock,
                   return_value=json.dumps({'summary': 'Build backend services', 'tech_stack': ['Python', 'PostgreSQL']})) as call:
            result = await analyze_vacancy_with_llm(
                title=scraped['title'], company=scraped.get('company', ''),
                location=scraped.get('location', ''), description=scraped['description'],
                provider='mistral', language='en')
            assert 'PostgreSQL' in call.call_args.args[0]
            assert result['tech_stack'] == ['Python', 'PostgreSQL']
    asyncio.run(scenario())


def test_analyze_vacancy_empty_description_skips_llm():
    async def scenario():
        with patch('backend.llm.call_mistral', new_callable=AsyncMock) as call:
            result = await analyze_vacancy_with_llm(
                title="Frontend Developer",
                company="Company",
                location="Remote",
                description="   ",
                provider="mistral",
                language="ru",
            )
            call.assert_not_called()
            assert result["summary"] == ""
            assert result["tech_stack"] == []
            assert result["ai_error"] == "Description is empty"
    asyncio.run(scenario())
