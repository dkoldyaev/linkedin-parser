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
    db: Optional[Session] = None,
    provider: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Summarize vacancy and extract tech stack & company info using configured LLM.
    Returns: { "summary": str, "tech_stack": list[str], "company_info": str }
    """
    if not provider:
        provider = get_setting_or_env(db, "llm_provider", "mistral").lower()

    mistral_key = get_setting_or_env(db, "mistral_api_key")
    gemini_key = get_setting_or_env(db, "gemini_api_key")
    mistral_model = get_setting_or_env(db, "mistral_model", "mistral-small-latest")
    gemini_model = get_setting_or_env(db, "gemini_model", "gemini-2.5-flash")

    # Prompt constructing
    prompt = f"""Проанализируй вакансию и сформируй краткое резюме на русском языке.

Название: {title}
Компания: {company}
Локация: {location}
Описание вакансии:
\"\"\"
{description[:8000]}
\"\"\"

Ответь строго в формате JSON со следующими полями:
{{
  "summary": "Кратко в 2-3 предложениях: что именно предстоит делать, суть задач, за что отвечает человек.",
  "tech_stack": ["название технологии 1", "технология 2"],
  "company_info": "1-2 предложения о том, чем занимается компания/какой продукт делает (из текста вакансии или контекста)."
}}
"""

    raw_response = None
    used_provider = provider

    try:
        if provider == "gemini":
            if not gemini_key:
                raise ValueError("Gemini API key is not configured")
            raw_response = await call_gemini(prompt, gemini_key, gemini_model)
        else:
            # Default to Mistral
            if not mistral_key:
                # If mistral key is missing but gemini is present, try fallback
                if gemini_key:
                    used_provider = "gemini"
                    raw_response = await call_gemini(prompt, gemini_key, gemini_model)
                else:
                    raise ValueError("Mistral API key is not configured")
            else:
                raw_response = await call_mistral(prompt, mistral_key, mistral_model)
    except Exception as e:
        logger.warning(f"LLM call failed for provider {used_provider}: {e}")
        # Return fallback heuristic
        fallback_stack = extract_fallback_tech_stack(description)
        return {
            "summary": f"Вакансия {title} в {company} ({location}). Ключевой стек: {', '.join(fallback_stack[:5]) if fallback_stack else 'не указан'}.",
            "tech_stack": fallback_stack,
            "company_info": f"Компания {company} ({location})" if company else "",
            "ai_error": str(e)
        }

    # Clean and parse JSON response
    try:
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        data = json.loads(cleaned)
        return {
            "summary": data.get("summary", "").strip(),
            "tech_stack": [t.strip() for t in data.get("tech_stack", []) if isinstance(t, str) and t.strip()],
            "company_info": data.get("company_info", "").strip(),
            "ai_error": None,
        }
    except Exception as e:
        logger.error(f"Failed to parse LLM JSON output: {raw_response}. Error: {e}")
        return {
            "summary": raw_response[:300] if raw_response else "",
            "tech_stack": extract_fallback_tech_stack(description),
            "company_info": "",
            "ai_error": f"JSON parse error: {e}"
        }
