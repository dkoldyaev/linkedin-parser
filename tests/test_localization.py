import asyncio
from backend.llm import analyze_vacancy_with_llm
from backend.models import AppSetting
from backend.schemas import SettingsResponse, SettingsUpdateRequest
from backend.mercure import (
    EVENT_VACANCY_CREATED,
    EVENT_VACANCY_UPDATED,
    EVENT_TASK_FAILED,
    EVENT_QUEUE_UPDATED,
    EVENT_QUEUE_IDLE,
    MSG_VACANCY_CREATED,
    MSG_VACANCY_UPDATED,
    MSG_TASK_FAILED,
    MSG_QUEUE_UPDATED,
    MSG_QUEUE_IDLE,
    ERR_SCRAPE_FAILED,
    ERR_AI_ANALYSIS_FAILED,
)
from backend.database import SessionLocal


def test_llm_requires_language_and_provider():
    """Test that analyze_vacancy_with_llm strictly raises ValueError if language or provider is missing."""
    async def _test():
        # Missing provider
        err1 = False
        try:
            await analyze_vacancy_with_llm(
                title="Test Dev",
                company="Test Inc",
                location="Remote",
                description="Some desc",
                provider="",
                language="ru",
            )
        except ValueError as e:
            err1 = True
            assert "provider" in str(e).lower()
        assert err1, "Expected ValueError when provider is empty"

        # Missing language
        err2 = False
        try:
            await analyze_vacancy_with_llm(
                title="Test Dev",
                company="Test Inc",
                location="Remote",
                description="Some desc",
                provider="mistral",
                language="",
            )
        except ValueError as e:
            err2 = True
            assert "language" in str(e).lower()
        assert err2, "Expected ValueError when language is empty"

    asyncio.run(_test())
    print("✓ LLM strictly requires language and provider test passed")


def test_llm_fallback_language_texts():
    """Test that LLM fallback heuristics generate localized text according to language parameter."""
    from unittest.mock import patch

    async def _test():
        with patch("backend.llm.call_mistral", side_effect=RuntimeError("Simulated API Error")):
            # Fallback when LLM fails: RU
            res_ru = await analyze_vacancy_with_llm(
                title="Senior Python Developer",
                company="Acme Corp",
                location="Berlin, Germany",
                description="Requirements: Python, Docker, Kubernetes.",
                provider="mistral",
                language="ru",
                db=None,
            )
            assert "Вакансия Senior Python Developer в Acme Corp" in res_ru["summary"]
            assert "Python" in res_ru["tech_stack"]

            # Fallback when LLM fails: EN
            res_en = await analyze_vacancy_with_llm(
                title="Senior Python Developer",
                company="Acme Corp",
                location="Berlin, Germany",
                description="Requirements: Python, Docker, Kubernetes.",
                provider="mistral",
                language="en",
                db=None,
            )
            assert "Job vacancy Senior Python Developer at Acme Corp" in res_en["summary"]
            assert "Python" in res_en["tech_stack"]

    asyncio.run(_test())
    print("✓ LLM fallback texts localized test passed")


def test_settings_locale_schema():
    """Test SettingsResponse and SettingsUpdateRequest handle locale properly."""
    res = SettingsResponse(
        llm_provider="mistral",
        mistral_api_key_set=True,
        mistral_model="mistral-small-latest",
        gemini_api_key_set=False,
        gemini_model="gemini-2.5-flash",
        locale="en",
    )
    assert res.locale == "en"

    req = SettingsUpdateRequest(locale="ru")
    assert req.locale == "ru"
    print("✓ Settings locale schema test passed")


def test_mercure_constants():
    """Test that Mercure constants are properly defined and no raw text is required."""
    assert EVENT_VACANCY_CREATED == "vacancy_created"
    assert EVENT_VACANCY_UPDATED == "vacancy_updated"
    assert EVENT_TASK_FAILED == "task_failed"
    assert EVENT_QUEUE_UPDATED == "queue_updated"
    assert EVENT_QUEUE_IDLE == "queue_idle"

    assert MSG_VACANCY_CREATED == "VACANCY_CREATED"
    assert MSG_VACANCY_UPDATED == "VACANCY_UPDATED"
    assert MSG_TASK_FAILED == "TASK_FAILED"
    assert MSG_QUEUE_UPDATED == "QUEUE_UPDATED"
    assert MSG_QUEUE_IDLE == "QUEUE_IDLE"

    assert ERR_SCRAPE_FAILED == "ERR_SCRAPE_FAILED"
    assert ERR_AI_ANALYSIS_FAILED == "ERR_AI_ANALYSIS_FAILED"
    print("✓ Mercure constants test passed")


def test_settings_db_persistence():
    """Test saving and retrieving locale in AppSetting DB table."""
    with SessionLocal() as db:
        # Save 'en'
        setting = db.query(AppSetting).filter(AppSetting.key == "locale").first()
        if not setting:
            setting = AppSetting(key="locale", value="en")
            db.add(setting)
        else:
            setting.value = "en"
        db.commit()

        # Retrieve
        check = db.query(AppSetting).filter(AppSetting.key == "locale").first()
        assert check is not None
        assert check.value == "en"

        # Set back to 'ru'
        check.value = "ru"
        db.commit()
    print("✓ Settings DB persistence test passed")


if __name__ == "__main__":
    test_llm_requires_language_and_provider()
    test_llm_fallback_language_texts()
    test_settings_locale_schema()
    test_mercure_constants()
    test_settings_db_persistence()
    print("\nAll localization tests successfully passed!")
