import asyncio
import json
from unittest.mock import AsyncMock, patch

import pytest

from backend.llm import (
    analyze_vacancy_with_llm,
    anonymize_companies_with_llm,
    evaluate_vacancy_compatibility_with_llm,
)


@pytest.mark.parametrize(('language', 'instruction', 'document'), [
    ('ru', 'рекомендации пишите на русском языке', 'Документ 1'),
    ('en', 'human-readable fields in English', 'Document 1'),
])
@pytest.mark.parametrize('provider', ['mistral', 'gemini'])
def test_compatibility_prompt_uses_interface_language(language, instruction, document, provider):
    with patch.dict('os.environ', {f'{provider.upper()}_API_KEY': 'test-key'}), patch(
        f'backend.llm.call_{provider}', new_callable=AsyncMock, return_value=json.dumps({'overallScore': 75})
    ) as call:
        asyncio.run(evaluate_vacancy_compatibility_with_llm(
            vacancy_text='VACANCY DATA', cv_text='CV DATA', provider=provider, language=language
        ))
    assert instruction in call.call_args.kwargs['system_prompt']
    prompt = call.call_args.args[0]
    assert prompt.startswith(document)
    assert prompt.index('VACANCY DATA') < prompt.index('CV DATA')
    assert prompt.rstrip().endswith('сведений.' if language == 'ru' else 'uncertainty.')


@pytest.mark.parametrize(('language', 'instruction'), [
    ('ru', 'Оба поля должны быть на русском языке'),
    ('en', 'clear English'),
])
def test_vacancy_prompt_uses_interface_language(language, instruction):
    with patch.dict('os.environ', {'MISTRAL_API_KEY': 'test-key'}), patch(
        'backend.llm.call_mistral', new_callable=AsyncMock, return_value='{}'
    ) as call:
        asyncio.run(analyze_vacancy_with_llm('title', 'company', 'place', 'description', 'mistral', language))
    assert instruction in call.call_args.kwargs['system_prompt']
    assert 'description' in call.call_args.args[0]


@pytest.mark.parametrize(('language', 'instruction'), [
    ('ru', 'replacement пишите на русском языке'),
    ('en', 'Write each replacement in English'),
])
def test_anonymization_prompt_uses_interface_language(language, instruction):
    with patch.dict('os.environ', {'MISTRAL_API_KEY': 'test-key'}), patch(
        'backend.llm.call_mistral', new_callable=AsyncMock, return_value='{"replacements": []}'
    ) as call:
        asyncio.run(anonymize_companies_with_llm(['Example'], 'mistral', language=language))
    assert instruction in call.call_args.kwargs['system_prompt']
    assert '["Example"]' in call.call_args.args[0]
