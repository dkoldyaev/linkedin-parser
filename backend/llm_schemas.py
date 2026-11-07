"""JSON response contracts shared by prompts and structured-output providers."""


def obj(properties, description=None, required=None):
    result = {"type": "object", "properties": properties,
              "required": list(properties) if required is None else required}
    if description:
        result["description"] = description
    return result


def field(kind, description, **constraints):
    return {"type": kind, "description": description, **constraints}


def array(items, description):
    return field("array", description, items=items)


def vacancy_schema(language):
    en = language.lower().startswith("en")
    def d(english, russian): return english if en else russian
    nullable = ["string", "null"]
    return obj({
        "title": field(nullable, d("Exact job title from the vacancy; use the supplied title if absent.", "Точное название должности из вакансии; если его нет, используйте переданное название.")),
        "location": field(nullable, d("Location in English, or null if absent.", "Местоположение на английском языке или null, если оно не указано.")),
        "city": field(nullable, d("City in English, or null if absent.", "Город на английском языке или null, если он не указан.")),
        "country": field(nullable, d("Country in English, or null if absent.", "Страна на английском языке или null, если она не указана.")),
        "is_closed": field("boolean", d("True when applications are closed or the position is filled; otherwise false.", "true, если приём откликов закрыт или позиция занята; иначе false.")),
        "summary": field("string", d("One or two short sentences or fragments in English stating only explicitly described duties and key requirements; if duties are absent, state the role and listed requirements. Empty string if no meaningful facts.", "Одно или два коротких предложения или фразы на русском языке: только явно указанные обязанности и важные требования; если обязанностей нет, укажите роль и перечисленные требования. Пустая строка, если содержательных фактов нет.")),
        "tech_stack": array(field("string", d("Technology named in the vacancy.", "Технология из вакансии.")), d("Technologies mentioned in the vacancy.", "Технологии, упомянутые в вакансии.")),
        "company_info": field("string", d("One or two sentences about the company or product in English; empty if unknown.", "Одно или два предложения о компании или продукте на русском языке; пустая строка, если данных нет.")),
        "workplace_type": field(nullable, d("Work arrangement or null if unknown.", "Формат работы или null, если он не указан."), enum=["remote", "hybrid", "on-site", None]),
        "salary_min": field(["number", "null"], d("Minimum salary as an absolute number, or null.", "Минимальная зарплата абсолютным числом или null.")),
        "salary_max": field(["number", "null"], d("Maximum salary as an absolute number, or null.", "Максимальная зарплата абсолютным числом или null.")),
        "salary_currency": field(nullable, d("Currency code USD, EUR, GBP, CHF or CAD, or null.", "Код валюты USD, EUR, GBP, CHF или CAD либо null."), enum=["USD", "EUR", "GBP", "CHF", "CAD", None]),
        "salary_period": field(nullable, d("Salary period or null if unknown.", "Период зарплаты или null, если он не указан."), enum=["year", "month", "hour", "day", "week", None]),
    })


def anonymization_schema(language):
    en = language.lower().startswith("en")
    def d(a, b): return a if en else b
    return obj({"replacements": array(obj({
        "original": field("string", d("Exact input company name.", "Точное исходное название компании.")),
        "replacement": field("string", d("Generalized industry description in English.", "Обобщённое описание отрасли на русском языке.")),
    }), d("One replacement per input company, in input order.", "По одной замене для каждой компании в исходном порядке."))})


def compatibility_schema(language):
    en = language.lower().startswith("en")
    def d(a, b): return a if en else b
    def text(a, b): return field("string", d(a, b))
    def score(a, b): return field("number", d(a, b), minimum=0, maximum=100)
    requirement = lambda: text("Vacancy requirement.", "Требование вакансии.")
    reason = lambda: text("Explanation grounded in the documents.", "Обоснование на основе документов.")
    return obj({
        "summary": text("Concise compatibility assessment in English.", "Краткая оценка соответствия на русском языке."),
        "overallScore": score("Overall compatibility score.", "Общая оценка соответствия."),
        "matchedRequirements": array(obj({"requirement": requirement(), "evidence": text("Exact supporting quote from the CV in its original language.", "Точная подтверждающая цитата из резюме на языке оригинала.")}), d("Requirements supported by CV evidence.", "Требования, подтверждённые резюме.")),
        "missingRequirements": array(obj({"requirement": requirement(), "severity": field("string", d("Severity of the unconfirmed requirement.", "Значимость неподтверждённого требования."), enum=["low", "medium", "high", "critical"]), "reason": reason()}), d("Requirements without CV evidence.", "Требования без подтверждения в резюме.")),
        "criticalGaps": array(obj({"requirement": requirement(), "reason": reason()}), d("Explicit hard blockers.", "Явные критические препятствия.")),
        "seniorityAssessment": obj({"status": field("string", d("Seniority alignment.", "Соответствие уровня."), enum=["matched", "partially_matched", "mismatched", "unclear"]), "comment": reason()}),
        "recommendations": array(text("Actionable recommendation based on real experience, in English.", "Практическая рекомендация на основе реального опыта, на русском языке."), d("Recommendations for presenting actual experience.", "Рекомендации по представлению реального опыта.")),
        "dimensionScores": obj({
            "requiredTechnicalSkills": score("Coverage of mandatory technical skills.", "Соответствие обязательным техническим навыкам."),
            "relevantProfessionalExperience": score("Relevance of experience and responsibilities.", "Релевантность опыта и обязанностей."),
            "seniorityAlignment": score("Seniority alignment.", "Соответствие уровня."),
            "optionalTechnicalSkills": score("Coverage of optional technical skills.", "Соответствие дополнительным техническим навыкам."),
            "domainExperience": score("Relevance of domain experience.", "Релевантность опыта в предметной области."),
        }),
    })


def adapted_cv_schema():
    string = lambda desc: field("string", desc)
    nullable = lambda desc: field(["string", "null"], desc)
    location = lambda: obj({"city": nullable("City, or null if unknown."), "country": string("Country; use 'Unspecified' if unknown."), "region": string("Region, when available.")}, required=["city", "country"])
    highlights = lambda: array(string("Fact supported by the base CV."), "Vacancy-relevant facts from the base CV.")
    dates = lambda: {"startDate": string("Start year in YYYY format."), "endDate": nullable("End year in YYYY format, or null if ongoing.")}
    work = obj({
        "id": field("string", "Stable lowercase slug.", pattern="^[a-z0-9-]+$"),
        "title": string("Job title from the base CV."),
        "company": obj({"name": string("Employer name from the base CV."), "url": nullable("Employer HTTPS URL, or null if unknown.")}),
        "employmentType": field("string", "Employment type, or unspecified when unknown.", enum=["freelance", "full-time", "part-time", "contract", "internship", "unspecified"]),
        "startDate": string("Start date in YYYY-MM format."), "endDate": nullable("End date in YYYY-MM format, or null if ongoing."),
        "location": location(), "summary": nullable("Role summary grounded in the base CV."), "highlights": highlights(),
    })
    education = obj({"institution": string("Institution from the base CV."), "fieldOfStudy": string("Field of study from the base CV."), **dates(), "location": location(), "degree": nullable("Degree from the base CV, or null.")})
    volunteer = obj({"organization": string("Organization from the base CV."), "role": string("Volunteer role from the base CV."), **dates(), "location": location(), "highlights": highlights()})
    return obj({
        "name": string("Candidate name from the base CV."), "headline": string("Targeted headline supported by the base CV."), "summary": string("Targeted summary supported by the base CV."),
        "contact": obj({"email": string("Email from the base CV, or candidate@local if absent."), "phone": string("Phone from the base CV, or empty string."), "location": location(), "links": array(obj({"label": string("Link label."), "url": string("HTTPS URL from the base CV.")}), "Contact links from the base CV.")}),
        "workExperience": array(work, "Employment history from the base CV."),
        "skills": array(string("A skill supported by the base CV."), "Unique skills ordered by relevance."),
        "languages": array(string("A language from the base CV."), "Languages from the base CV."),
        "education": array(education, "Education from the base CV."),
        "volunteerExperience": array(volunteer, "Volunteer experience from the base CV."),
    })
