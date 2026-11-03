import asyncio
import json
from unittest.mock import AsyncMock, patch

import pytest

from backend.llm import evaluate_vacancy_compatibility_with_llm


@pytest.mark.parametrize(("language", "expected"), [("ru", "Russian"), ("en", "English")])
def test_compatibility_prompt_uses_interface_language(language, expected):
    response = json.dumps({"overallScore": 75})
    with patch.dict("os.environ", {"MISTRAL_API_KEY": "test-key"}), patch(
        "backend.llm.call_mistral", new_callable=AsyncMock, return_value=response
    ) as call:
        asyncio.run(evaluate_vacancy_compatibility_with_llm(
            vacancy_text="Python developer", cv_text="Python experience", provider="mistral", language=language
        ))
    prompt = call.call_args.args[0]
    assert f"recommendations in {expected}" in prompt
    assert "exact CV evidence quotes in their original language" in prompt
    assert "Keep JSON keys and enum values" in prompt
