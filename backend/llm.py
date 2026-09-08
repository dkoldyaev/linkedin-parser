import os
import json
import re
import logging
from typing import Dict, Any, List, Optional
import httpx
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from .models import AppSetting

load_dotenv()
logger = logging.getLogger(__name__)

FALLBACK_TECH_KEYWORDS = [
    "python", "javascript", "typescript", "golang", "go", "rust", "c++", "c#", ".net",
    "java", "kotlin", "scala", "php", "ruby", "swift", "react", "vue", "angular",
    "next.js", "nuxt", "svelte", "django", "fastapi", "flask", "spring", "node.js", "express",
    "nest.js", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "docker", "kubernetes", "k8s", "aws", "gcp", "azure", "terraform", "ansible",
    "graphql", "rest", "grpc", "kafka", "rabbitmq", "celery", "airflow", "ci/cd", "linux"
]


def extract_fallback_tech_stack(text: str) -> List[str]:
    """Basic keyword extraction fallback if no LLM key is provided."""
    found = []
    text_lower = text.lower()
    for tech in FALLBACK_TECH_KEYWORDS:
        pattern = r"\b" + re.escape(tech) + r"\b"
        if re.search(pattern, text_lower):
            # Prettify common tech names
            pretty = {
                "go": "Go",
                "golang": "Go",
                "k8s": "Kubernetes",
                "ci/cd": "CI/CD",
                "c#": "C#",
                "c++": "C++",
                ".net": ".NET",
                "aws": "AWS",
                "gcp": "GCP",
            }.get(tech, tech.title())
            if pretty not in found:
                found.append(pretty)
    return found[:12]


def get_setting_or_env(db: Optional[Session], key: str, default: str = "") -> str:
    """Retrieve setting from DB or environment variable."""
    if db:
        setting = db.query(AppSetting).filter(AppSetting.key == key).first()
        if setting and setting.value:
            return setting.value
    return os.getenv(key.upper(), default)


async def call_mistral(prompt: str, api_key: str, model: str = "open-mistral-nemo") -> str:
    """Call Mistral API via HTTP completions with automatic fallback for free tier."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    models_to_try = [model or "open-mistral-nemo"]
    for fallback in ["open-mistral-nemo", "open-mistral-7b", "ministral-8b-latest"]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    last_error = None
    async with httpx.AsyncClient(timeout=45.0) as client:
        for m in models_to_try:
            payload = {
                "model": m,
                "messages": [
                    {"role": "system", "content": "You are a professional recruitment and tech stack analyzer. Return ONLY valid JSON as requested, with no markdown code blocks."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            }
            resp = await client.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                last_error = f"Mistral API error ({resp.status_code}) on model {m}: {resp.text}"
                logger.warning(last_error)
                # If rate limited (429), try next free-tier model
                if resp.status_code == 429:
                    continue
                else:
                    break

        raise RuntimeError(last_error)


async def call_gemini(prompt: str, api_key: str, model: str = "gemini-2.5-flash") -> str:
    """Call Google Gemini API via official google-genai client."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    # Use generate_content with json response schema or standard json prompt
    config = types.GenerateContentConfig(
        temperature=0.2,
        response_mime_type="application/json",
    )
    
    # Run in thread pool since genai client is synchronous
    import asyncio
    loop = asyncio.get_running_loop()
    
    def _run():
        response = client.models.generate_content(
            model=model or "gemini-2.5-flash",
            contents=prompt,
            config=config,
        )
        return response.text

    return await loop.run_in_executor(None, _run)


async def analyze_vacancy_with_llm(
    title: str,
    company: str,
    location: str,
    description: str,
    provider: str,
    language: str,
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Summarize vacancy and extract tech stack & company info using configured LLM.
    `provider` and `language` are strictly required.
    Returns: { "summary": str, "tech_stack": list[str], "company_info": str, ... }
    """
    if not provider or not str(provider).strip():
        raise ValueError("Parameter 'provider' is required and cannot be empty")
    if not language or not str(language).strip():
        raise ValueError("Parameter 'language' is required and cannot be empty")

    provider = str(provider).strip().lower()
    language = str(language).strip().lower()

    mistral_key = get_setting_or_env(db, "mistral_api_key")
    gemini_key = get_setting_or_env(db, "gemini_api_key")
    mistral_model = get_setting_or_env(db, "mistral_model", "mistral-small-latest")
    gemini_model = get_setting_or_env(db, "gemini_model", "gemini-2.5-flash")

    # Prompt constructing based on language
    if language.startswith("en"):
        prompt = f"""Analyze the job vacancy and generate a concise summary in English.

Rules for the "summary" field:
- Write extremely concisely and strictly to the point (1-2 crisp sentences).
- Categorically avoid filler words and template phrases: DO NOT use phrases like "The position involves", "The company is looking for", "Responsibilities include", "The candidate will", "This role requires" or similar.
- State the core work and tasks directly (e.g.: "Develop UI components, optimize rendering performance, and expand the design system").

Rules for salary:
- Extract compensation/salary if specified in the job text or metadata.
- Return "salary_min" (number or null) and "salary_max" (number or null). If a single rate is given, set it in both salary_min and salary_max or only salary_min. Values must be absolute numbers (e.g. 120000, not "120k").
- "salary_currency": currency symbol or code ("$", "€", "₽", "£", "USD", "EUR", etc., or null if not specified).
- "salary_period": strictly one of: "year", "month", "hour", "day", "week" (or null if salary is not specified). If "a year", "/yr", "annual" -> "year". If "a month", "/mo" -> "month". If "per hour", "/hr" -> "hour".

Rules for workplace_type:
- Extract work format (strictly one of: "remote", "hybrid", "on-site", or null if not mentioned):
  - "remote": remote work (Remote, WFH, Work from home, 100% remote).
  - "hybrid": hybrid work (Hybrid, flexible office/home schedule).
  - "on-site": strictly on-site / in office (On-site, Onsite, In office).
  - null: if format is not mentioned.

Job Title: {title}
Company: {company}
Location: {location}
Job Description:
\"\"\"
{description[:8000]}
\"\"\"

Respond strictly in JSON format with the following fields:
{{
  "summary": "Concise and to the point: core tasks without filler phrases (e.g.: 'Develop UI components, optimize rendering performance, and expand the design system').",
  "tech_stack": ["tech 1", "tech 2"],
  "company_info": "1-2 sentences about what the company does / what product it builds.",
  "workplace_type": "remote",
  "salary_min": 120000,
  "salary_max": 150000,
  "salary_currency": "$",
  "salary_period": "year"
}}
"""
    else:
        prompt = f"""Проанализируй вакансию и сформируй краткое резюме на русском языке.

Правила для поля "summary":
- Пиши предельно кратко и строго по делу (1-2 емких предложения).
- Категорически избегай шаблонных фраз и "воды": НЕ используй конструкции вроде "Вакансия предполагает", "Компания ищет специалиста", "В обязанности входит", "Кандидату предстоит", "Данная позиция требует" и подобные.
- Сразу формулируй суть работы и задач (например: "Нужно разрабатывать UI-kit, оптимизировать рендеринг и развивать дизайн-систему").

Правила для зарплаты:
- Извлеки размер зарплаты (компенсации), если она указана в тексте или метаданных вакансии.
- Верни "salary_min" (число или null) и "salary_max" (число или null). Если указана фиксированная сумма без вилки, укажи ее в salary_min и salary_max одинаковой или только в salary_min. Числа должны быть абсолютными числами (например, 120000, а не "120k").
- "salary_currency": символ или код валюты ("$", "€", "₽", "£", "USD", "EUR" и т.д., или null если не указано).
- "salary_period": строго одно из значений: "year", "month", "hour", "day", "week" (или null если зарплата не указана). Если указано "a year", "/yr", "per year", "annual" -> "year". Если "a month", "/mo", "monthly" -> "month". Если "per hour", "/hr", "hourly" -> "hour".
Правила для формата работы (workplace_type):
- Извлеки формат работы (строго одно из значений: "remote", "hybrid", "on-site", или null если невозможно определить):
  - "remote": удаленная работа (Remote, Удаленно, WFH, Work from home, 100% remote).
  - "hybrid": гибридный формат (Hybrid, Гибрид, гибкий график офис/дом, X дней в неделю в офисе).
  - "on-site": работа строго в офисе / на месте (On-site, Onsite, В офисе, На территории работодателя).
  - null: если формат работы не упомянут ни в описании, ни в локации.

Название: {title}
Компания: {company}
Локация: {location}
Описание вакансии:
\"\"\"
{description[:8000]}
\"\"\"

Ответь строго в формате JSON со следующими полями:
{{
  "summary": "Кратко и по делу: суть задач без вводных слов и штампов (например: 'Нужно разрабатывать UI-kit, оптимизировать рендеринг и развивать дизайн-систему').",
  "tech_stack": ["название технологии 1", "технология 2"],
  "company_info": "1-2 предложения о том, чем занимается компания/какой продукт делает (из текста вакансии или контекста).",
  "workplace_type": "remote",
  "salary_min": 120000,
  "salary_max": 150000,
  "salary_currency": "$",
  "salary_period": "year"
}}
"""

    raw_response = None

    try:
        if provider == "gemini":
            if not gemini_key:
                raise ValueError("Gemini API key is not configured")
            raw_response = await call_gemini(prompt, gemini_key, gemini_model)
        elif provider == "mistral":
            if not mistral_key:
                raise ValueError("Mistral API key is not configured")
            raw_response = await call_mistral(prompt, mistral_key, mistral_model)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
    except Exception as e:
        logger.warning(f"LLM call failed for provider {provider}: {e}")
        # Return fallback heuristic
        fallback_stack = extract_fallback_tech_stack(description)
        if language.startswith("en"):
            fallback_summary = f"Job vacancy {title} at {company} ({location}). Key tech stack: {', '.join(fallback_stack[:5]) if fallback_stack else 'not specified'}."
            fallback_comp = f"Company {company} ({location})" if company else ""
        else:
            fallback_summary = f"Вакансия {title} в {company} ({location}). Ключевой стек: {', '.join(fallback_stack[:5]) if fallback_stack else 'не указан'}."
            fallback_comp = f"Компания {company} ({location})" if company else ""

        return {
            "summary": fallback_summary,
            "tech_stack": fallback_stack,
            "company_info": fallback_comp,
            "workplace_type": None,
            "salary_min": None,
            "salary_max": None,
            "salary_currency": None,
            "salary_period": None,
            "ai_error": str(e)
        }

    # Clean and parse JSON response
    try:
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        data = json.loads(cleaned)

        # Normalize workplace_type
        raw_workplace = str(data.get("workplace_type") or "").strip().lower()
        clean_workplace = None
        if any(k in raw_workplace for k in ["remote", "удален", "telecommute", "wfh"]):
            clean_workplace = "remote"
        elif any(k in raw_workplace for k in ["hybrid", "гибрид"]):
            clean_workplace = "hybrid"
        elif any(k in raw_workplace for k in ["on-site", "onsite", "on site", "офис"]):
            clean_workplace = "on-site"

        # Normalize salary fields
        def _to_float(v):
            if v is None:
                return None
            try:
                if isinstance(v, str):
                    v = v.replace(",", "").replace(" ", "").replace("k", "000").replace("K", "000")
                return float(v)
            except Exception:
                return None

        clean_min = _to_float(data.get("salary_min"))
        clean_max = _to_float(data.get("salary_max"))
        if clean_min is not None and clean_max is not None and clean_min > clean_max:
            clean_min, clean_max = clean_max, clean_min

        clean_curr = str(data.get("salary_currency")).strip() if data.get("salary_currency") else None
        raw_period = str(data.get("salary_period")).strip().lower() if data.get("salary_period") else None
        clean_period = None
        if raw_period:
            if "year" in raw_period or "yr" in raw_period or "annum" in raw_period:
                clean_period = "year"
            elif "month" in raw_period or "mo" in raw_period:
                clean_period = "month"
            elif "hour" in raw_period or "hr" in raw_period:
                clean_period = "hour"
            elif "week" in raw_period:
                clean_period = "week"
            elif "day" in raw_period:
                clean_period = "day"

        return {
            "summary": data.get("summary", "").strip(),
            "tech_stack": [t.strip() for t in data.get("tech_stack", []) if isinstance(t, str) and t.strip()],
            "company_info": data.get("company_info", "").strip(),
            "workplace_type": clean_workplace,
            "salary_min": clean_min,
            "salary_max": clean_max,
            "salary_currency": clean_curr,
            "salary_period": clean_period,
            "ai_error": None,
        }
    except Exception as e:
        logger.error(f"Failed to parse LLM JSON output: {raw_response}. Error: {e}")
        return {
            "summary": raw_response[:300] if raw_response else "",
            "tech_stack": extract_fallback_tech_stack(description),
            "company_info": "",
            "workplace_type": None,
            "salary_min": None,
            "salary_max": None,
            "salary_currency": None,
            "salary_period": None,
            "ai_error": f"JSON parse error: {e}"
        }
