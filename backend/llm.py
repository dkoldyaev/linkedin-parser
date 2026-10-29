import os
import json
import re
import logging
from typing import Dict, Any, List, Optional
import httpx
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from .models import AppSetting, UserSetting

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


def get_setting_or_env(db: Optional[Session], key: str, default: str = "", user_id: Optional[int] = None) -> str:
    """Retrieve setting from user_settings, falling back to AppSetting or environment variable."""
    if db:
        if user_id:
            u_setting = db.query(UserSetting).filter(UserSetting.user_id == user_id, UserSetting.key == key).first()
            if u_setting and u_setting.value is not None:
                return u_setting.value
        setting = db.query(AppSetting).filter(AppSetting.key == key).first()
        if setting and setting.value is not None:
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


async def call_gemini(prompt: str, api_key: str, model: str = "gemini-2.5-flash", response_schema: Optional[Dict[str, Any]] = None) -> str:
    """Call Google Gemini API via official google-genai client."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    
    config_kwargs = {
        "temperature": 0.2,
        "response_mime_type": "application/json",
    }
    if response_schema:
        config_kwargs["response_schema"] = response_schema
        
    config = types.GenerateContentConfig(**config_kwargs)
    
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
    user_id: Optional[int] = None,
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

    mistral_key = os.getenv("MISTRAL_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    mistral_model = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # Map language code to full language name for the prompt
    target_language = "English" if language.startswith("en") else "Russian"

    json_format = {
        "type": "object",
        "properties": {
            "title": {
                "type": ["string", "null"],
                "description": "Exact job title extracted from the description, or use original if not found."
            },
            "location": {
                "type": ["string", "null"],
                "description": "Extract city/country/location from description, if present. Otherwise null."
            },
            "city": {
                "type": ["string", "null"],
                "description": "City extracted from the location or description (strictly in English). Null if not specified."
            },
            "country": {
                "type": ["string", "null"],
                "description": "Country extracted from the location or description (strictly in English). Null if not specified."
            },
            "is_closed": {
                "type": "boolean",
                "description": "True if the job is closed, no longer accepting applications, or filled. Otherwise false."
            },
            "summary": {
                "type": "string",
                "description": f"Concise and to the point: core tasks without filler phrases (e.g.: 'Develop UI components, optimize rendering performance, and expand the design system'). MUST be in {target_language}."
            },
            "tech_stack": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of technologies mentioned in the job description."
            },
            "company_info": {
                "type": "string",
                "description": f"1-2 sentences about what the company does / what product it builds. MUST be in {target_language}."
            },
            "workplace_type": {
                "type": ["string", "null"],
                "enum": ["remote", "hybrid", "on-site", None],
                "description": "Work format. Strictly one of: 'remote', 'hybrid', 'on-site', or null."
            },
            "salary_min": {
                "type": ["number", "null"]
            },
            "salary_max": {
                "type": ["number", "null"]
            },
            "salary_currency": {
                "type": ["string", "null"]
            },
            "salary_period": {
                "type": ["string", "null"],
                "enum": ["year", "month", "hour", "day", "week", None]
            }
        },
        "required": [
            "title", "location", "is_closed", "summary", "tech_stack",
            "company_info", "workplace_type", "salary_min", "salary_max",
            "salary_currency", "salary_period"
        ]
    }

    json_format_str = json.dumps(json_format, indent=2, ensure_ascii=False)

    prompt = f"""Analyze the job vacancy and generate a concise summary.
CRITICAL INSTRUCTION: The values for "summary" and "company_info" MUST be written in {target_language}.

Rules for the "summary" field:
- Write extremely concisely and strictly to the point (3-5 crisp sentences).
- Categorically avoid filler words and template phrases: DO NOT use phrases like "The position involves", "The company is looking for", "Responsibilities include", "The candidate will", "This role requires" or similar.
- State the core work and tasks directly.
- The summary MUST be in {target_language}.

Rules for salary:
- Extract compensation/salary if specified in the job text or metadata.
- Return "salary_min" (number or null) and "salary_max" (number or null). If a single rate is given, set it in both salary_min and salary_max or only salary_min. Values must be absolute numbers (e.g. 120000, not "120k").
- "salary_currency": currency code (only "USD", "EUR", "GBP", "CHF", "CAD", or null if not specified).
- "salary_period": strictly one of: "year", "month", "hour", "day", "week" (or null if salary is not specified). If "a year", "/yr", "annual" -> "year". If "a month", "/mo" -> "month". If "per hour", "/hr" -> "hour".

Rules for workplace_type:
- Extract work format (strictly one of: "remote", "hybrid", "on-site", or null if not mentioned):
  - "remote": remote work (Remote, WFH, Work from home, 100% remote).
  - "hybrid": hybrid work (Hybrid, flexible office/home schedule).
  - "on-site": strictly on-site / in office (On-site, Onsite, In office).
  - null: if format is not mentioned.

Rules for is_closed flag:
- Analyze the text for phrases indicating that the job is closed, no longer accepting applications, or filled (e.g. "No longer accepting applications", "Role closed", "Position filled", "Не принимает отклики", etc.).
- Set "is_closed": true if such phrases are found, otherwise false.

Rules for location, city, and country:
- Always translate "city" and "country" into English (e.g. if the text says "Москва, Россия", output "city": "Moscow", "country": "Russia").
- The "location", "city", and "country" MUST ALWAYS BE STRICTLY IN ENGLISH, regardless of the target language for the summary.


Job Title: {title or "--check the description--"}
Company: {company or "--check the description--"}
Location: {location or "--check the description--"}
Job Description:
\"\"\"
{description}
\"\"\"

Respond strictly in valid JSON matching the following JSON Schema:
{json_format_str}
"""

    raw_response = None

    try:
        if provider == "gemini":
            if not gemini_key:
                raise ValueError("Gemini API key is not configured")
            raw_response = await call_gemini(prompt, gemini_key, gemini_model, response_schema=json_format)
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
            "title": None,
            "location": None,
            "city": None,
            "country": None,
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

    # Parse JSON response directly since APIs guarantee valid JSON
    try:
        data = json.loads(raw_response)

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

        def safe_str(val, default=None):
            if val is None:
                return default
            if isinstance(val, str):
                s = val.strip()
                if s.lower() in ("null", "none", "n/a", ""):
                    return default
                return s
            return str(val).strip()

        return {
            "title": safe_str(data.get("title")),
            "location": safe_str(data.get("location")),
            "city": safe_str(data.get("city")),
            "country": safe_str(data.get("country")),
            "summary": safe_str(data.get("summary"), default=""),
            "tech_stack": [t.strip() for t in data.get("tech_stack", []) if isinstance(t, str) and t.strip()],
            "company_info": safe_str(data.get("company_info"), default=""),
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
            "title": None,
            "location": None,
            "city": None,
            "country": None,
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


# =====================================================================
# CV Anonymization & Vacancy Matching Functions
# =====================================================================

SCORING_WEIGHTS = {
    "required_technical_skills": 0.40,
    "relevant_professional_experience": 0.25,
    "seniority_alignment": 0.15,
    "optional_technical_skills": 0.10,
    "domain_experience": 0.10,
}

SCORING_POLICY_VERSION = "v1.0"


def calculate_compatibility_score(dimension_scores: Dict[str, float], critical_gaps_count: int = 0) -> float:
    """
    Calculates deterministic compatibility percentage (0-100) based on policy weights
    and critical gaps count.
    """
    req_tech = float(dimension_scores.get("requiredTechnicalSkills", 0))
    prof_exp = float(dimension_scores.get("relevantProfessionalExperience", 0))
    sen_align = float(dimension_scores.get("seniorityAlignment", 0))
    opt_tech = float(dimension_scores.get("optionalTechnicalSkills", 0))
    dom_exp = float(dimension_scores.get("domainExperience", 0))

    raw = (
        req_tech * SCORING_WEIGHTS["required_technical_skills"]
        + prof_exp * SCORING_WEIGHTS["relevant_professional_experience"]
        + sen_align * SCORING_WEIGHTS["seniority_alignment"]
        + opt_tech * SCORING_WEIGHTS["optional_technical_skills"]
        + dom_exp * SCORING_WEIGHTS["domain_experience"]
    )

    penalty = min(critical_gaps_count * 15.0, 45.0)
    final_score = max(0.0, min(100.0, round(raw - penalty, 1)))
    return final_score


async def anonymize_companies_with_llm(
    companies: List[str],
    provider: str,
    db: Optional[Session] = None,
    user_id: Optional[int] = None,
) -> List[Dict[str, str]]:
    """
    Replaces brand company names with generalized industry categories using configured LLM.
    Sends strictly only the list of company names.
    """
    if not companies:
        return []

    provider = str(provider).strip().lower()
    mistral_key = os.getenv("MISTRAL_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    mistral_model = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    prompt = f"""You are an expert privacy classifier.
You will be provided with a JSON list of company/employer names.
For EACH company, return a generalized industry-level replacement that preserves the domain/industry category while removing the exact identifying brand name.

Examples:
- "Example Bank" -> "Digital bank" or "Commercial bank"
- "Revolut" -> "Fintech / Digital banking company"
- "Spotify" -> "Audio streaming / Media tech company"
- "Allianz" -> "Insurance company"
- "Amazon Web Services" -> "Cloud computing provider"
- "McKinsey" -> "Management consulting firm"

Return ONLY a valid JSON object matching this schema:
{{
  "replacements": [
    {{ "original": "company name", "replacement": "generalized industry replacement" }}
  ]
}}

Companies:
{json.dumps(companies, ensure_ascii=False)}
"""

    raw_response = ""
    if provider == "mistral":
        if not mistral_key:
            raise ValueError("Mistral API key is not configured")
        raw_response = await call_mistral(prompt, mistral_key, mistral_model)
    elif provider == "gemini":
        if not gemini_key:
            raise ValueError("Gemini API key is not configured")
        raw_response = await call_gemini(prompt, gemini_key, gemini_model)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

    try:
        data = json.loads(raw_response)
        return data.get("replacements", [])
    except Exception as e:
        logger.error(f"Failed to parse LLM company anonymization JSON: {raw_response}. Error: {e}")
        # Deterministic fallback if model json fails
        return [{"original": c, "replacement": "Company in industry"} for c in companies]


async def evaluate_vacancy_compatibility_with_llm(
    vacancy_text: str,
    cv_text: str,
    provider: str,
    db: Optional[Session] = None,
    user_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Evaluates vacancy requirements vs approved CV text using configured LLM.
    Returns structured assessment with matched/missing requirements and deterministic overallScore.
    """
    provider = str(provider).strip().lower()
    mistral_key = os.getenv("MISTRAL_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    mistral_model = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    active_model = mistral_model if provider == "mistral" else gemini_model

    prompt = f"""You are a strict, objective technical recruiter and job compatibility evaluator.
Compare the following candidate CV against the Job Vacancy Description.

Rules:
1. Grounding: Every matchedRequirement MUST cite concrete, factual evidence from the CV text.
2. Missing requirements: If the CV does not mention a required tool, library, or responsibility, classify it under missingRequirements. Do NOT assume candidate knows it unless explicitly supported.
3. Critical Gaps: Identify hard blockers (e.g. required language/authorization or must-have mandatory core stack that candidate completely lacks).
4. Seniority: Assess whether the years of experience and level of responsibility match what the vacancy seeks.
5. Overall Match Score (0-100%): Provide your comprehensive expert holistic score for how well this candidate fits the role.
6. Dimension Scores: Provide objective 0-100 scores for:
   - requiredTechnicalSkills: coverage of core mandatory technologies.
   - relevantProfessionalExperience: similarity of past duties and scope.
   - seniorityAlignment: match with requested seniority (junior, mid, senior, lead).
   - optionalTechnicalSkills: coverage of nice-to-have / bonus tools.
   - domainExperience: relevance of industry/domain knowledge.
7. Recommendations: Actionable tips for how the candidate can better showcase their REAL experience for this role. Do NOT hallucinate fake experience.

Output strictly valid JSON matching this schema:
{{
  "summary": "Short concise summary of compatibility",
  "overallScore": 0-100,
  "matchedRequirements": [
    {{ "requirement": "Technology/Skill", "evidence": "Exact evidence quote/mention from CV" }}
  ],
  "missingRequirements": [
    {{ "requirement": "Technology/Skill", "severity": "low" | "medium" | "high" | "critical", "reason": "Reason missing" }}
  ],
  "criticalGaps": [
    {{ "requirement": "Requirement name", "reason": "Why it is critical blocker" }}
  ],
  "seniorityAssessment": {{
    "status": "matched" | "partially_matched" | "mismatched" | "unclear",
    "comment": "Assessment comment"
  }},
  "recommendations": ["Actionable presentation tip 1", "Actionable presentation tip 2"],
  "dimensionScores": {{
    "requiredTechnicalSkills": 0-100,
    "relevantProfessionalExperience": 0-100,
    "seniorityAlignment": 0-100,
    "optionalTechnicalSkills": 0-100,
    "domainExperience": 0-100
  }}
}}

=== VACANCY DESCRIPTION ===
{vacancy_text}

=== CANDIDATE CV ===
{cv_text}
"""

    raw_response = ""
    if provider == "mistral":
        if not mistral_key:
            raise ValueError("Mistral API key is not configured")
        raw_response = await call_mistral(prompt, mistral_key, mistral_model)
    elif provider == "gemini":
        if not gemini_key:
            raise ValueError("Gemini API key is not configured")
        raw_response = await call_gemini(prompt, gemini_key, gemini_model)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

    try:
        data = json.loads(raw_response)
    except Exception as e:
        logger.error(f"Failed to parse LLM compatibility JSON: {raw_response}. Error: {e}")
        raise RuntimeError(f"Failed to parse LLM compatibility evaluation: {e}")

    dim_scores = data.get("dimensionScores") or {
        "requiredTechnicalSkills": 50,
        "relevantProfessionalExperience": 50,
        "seniorityAlignment": 50,
        "optionalTechnicalSkills": 50,
        "domainExperience": 50,
    }
    crit_gaps = data.get("criticalGaps") or []
    calculated_score = calculate_compatibility_score(dim_scores, len(crit_gaps))

    # Use LLM direct assessment score when provided by the model; fallback to calculated if missing/invalid
    raw_llm_score = data.get("overallScore")
    if raw_llm_score is not None:
        try:
            llm_score = float(raw_llm_score)
            llm_score = max(0.0, min(100.0, round(llm_score, 1)))
        except (ValueError, TypeError):
            llm_score = calculated_score
    else:
        llm_score = calculated_score

    # Primary overallScore is the LLM score
    overall_score = llm_score

    return {
        **data,
        "overallScore": overall_score,
        "llmScore": llm_score,
        "calculatedScore": calculated_score,
        "scoringPolicyVersion": SCORING_POLICY_VERSION,
        "model": active_model,
    }

