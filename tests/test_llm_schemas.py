import asyncio
import json
import os
import unittest
from unittest.mock import AsyncMock, patch

from google.genai import types
from backend.llm import (analyze_vacancy_with_llm, anonymize_companies_with_llm,
                         evaluate_vacancy_compatibility_with_llm, adapt_cv_for_vacancy_with_llm)
from backend.llm_schemas import vacancy_schema, anonymization_schema, compatibility_schema, adapted_cv_schema


class ResponseSchemasTest(unittest.TestCase):
    def test_contracts_are_accepted_by_gemini_sdk(self):
        for schema in (vacancy_schema('ru'), vacancy_schema('en'), anonymization_schema('ru'),
                       compatibility_schema('en'), adapted_cv_schema()):
            with self.subTest(schema=schema):
                types.GenerateContentConfig(response_mime_type='application/json', response_schema=schema)

    def test_schema_details(self):
        vacancy = vacancy_schema('ru')
        self.assertIn('русском', vacancy['properties']['summary']['description'])
        self.assertEqual(vacancy['properties']['salary_period']['enum'], ['year', 'month', 'hour', 'day', 'week', None])
        compatibility = compatibility_schema('en')
        self.assertEqual(compatibility['properties']['overallScore']['maximum'], 100)
        missing = compatibility['properties']['missingRequirements']['items']
        self.assertEqual(missing['properties']['severity']['enum'], ['low', 'medium', 'high', 'critical'])
        self.assertIn('reason', missing['required'])
        cv = adapted_cv_schema()
        self.assertIn('workExperience', cv['required'])
        self.assertIn('company', cv['properties']['workExperience']['items']['required'])
        self.assertIn('original', anonymization_schema('ru')['properties']['replacements']['items']['required'])

    def test_vacancy_summary_prompt_requires_short_grounded_output(self):
        async def check():
            vacancy = 'Stark Industries is looking for a Full Stack Developer. Requirements: Python, PyTorch, Airflow.'
            for language, expected, rule in (
                ('ru', 'Full Stack Developer. Требуются Python, PyTorch и Airflow.', 'Не додумывайте обязанности'),
                ('en', 'Full Stack Developer. Required: Python, PyTorch, Airflow.', 'Never infer duties'),
            ):
                for provider in ('mistral', 'gemini'):
                    with self.subTest(language=language, provider=provider), patch.dict(
                        os.environ, {provider.upper() + '_API_KEY': 'test'}
                    ), patch('backend.llm.call_' + provider, new_callable=AsyncMock, return_value='{}') as call:
                        await analyze_vacancy_with_llm('', '', '', vacancy, provider, language)
                        instructions = call.call_args.kwargs['system_prompt']
                        self.assertIn(expected, instructions)
                        self.assertIn(rule, instructions)
                        self.assertIn(vacancy, call.call_args.args[0])
        asyncio.run(check())

    def test_each_call_includes_schema_and_passes_it_to_gemini(self):
        async def check():
            with patch.dict(os.environ, {'GEMINI_API_KEY': 'test'}), patch(
                'backend.llm.call_gemini', new_callable=AsyncMock, return_value='{}'
            ) as call:
                calls = [
                    analyze_vacancy_with_llm('title', 'company', 'location', 'description', 'gemini', 'ru'),
                    anonymize_companies_with_llm(['Company'], 'gemini', language='en'),
                    evaluate_vacancy_compatibility_with_llm('vacancy', 'cv', 'gemini', language='ru'),
                    adapt_cv_for_vacancy_with_llm('cv', 'vacancy', gemini_key='test', active_provider='gemini'),
                ]
                for task in calls:
                    await task
                    schema = call.call_args.kwargs['response_schema']
                    self.assertEqual(schema['type'], 'object')
                    self.assertIn(json.dumps(schema, ensure_ascii=False, indent=2), call.call_args.kwargs['system_prompt'])
        asyncio.run(check())


if __name__ == '__main__':
    unittest.main()
