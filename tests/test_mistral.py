"""Provider contract without sending paid requests or embedding credentials."""
import asyncio
import json
from unittest.mock import AsyncMock, patch
from backend.llm import analyze_vacancy_with_llm


def test_mistral_analysis_contract(monkeypatch):
    monkeypatch.setenv("MISTRAL_API_KEY", "test-only-not-a-real-key")
    with patch("backend.llm.call_mistral", new_callable=AsyncMock,
               return_value=json.dumps({"summary": "Test", "tech_stack": ["Python"]})) as call:
        result = asyncio.run(analyze_vacancy_with_llm(
            title="Engineer", company="Test", location="Remote", description="Python role",
            provider="mistral", language="en"))
    call.assert_awaited_once()
    assert result["summary"] == "Test"
