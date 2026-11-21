<?php

declare(strict_types=1);

namespace App\Service\Llm;

class MockLlmProvider implements LlmProviderInterface
{
    public function getName(): string
    {
        return 'mock';
    }

    public function summarizeVacancy(
        string $title,
        string $company,
        string $description,
        string $location,
        string $language,
        array $context
    ): array {
        $extractedStack = ['Python', 'PostgreSQL', 'Docker'];
        $isEn = str_starts_with(strtolower($language), 'en');

        $effectiveCompany = $company !== '' ? $company : 'Tech Corp';
        $summary = $isEn
            ? sprintf('[Mock LLM] Develop and maintain backend services at %s. Key stack: %s.', $effectiveCompany, implode(', ', array_slice($extractedStack, 0, 5)))
            : sprintf('[Mock LLM] Разработка и поддержка сервисов в %s. Ключевой стек: %s.', $effectiveCompany, implode(', ', array_slice($extractedStack, 0, 5)));

        $companyInfo = $isEn
            ? sprintf('%s is a technology company operating in software development.', $effectiveCompany)
            : sprintf('%s — технологическая компания в сфере разработки ПО.', $effectiveCompany);

        return [
            'title' => $title !== '' ? $title : 'Software Engineer',
            'location' => $location !== '' ? $location : 'Berlin, Germany',
            'city' => 'Berlin',
            'country' => 'Germany',
            'summary' => $summary,
            'tech_stack' => $extractedStack,
            'company_info' => $companyInfo,
            'workplace_type' => 'remote',
            'salary_min' => 5000.0,
            'salary_max' => 7500.0,
            'salary_currency' => 'USD',
            'salary_period' => 'month',
        ];
    }

    public function evaluateCompatibility(
        string $vacancyText,
        string $cvText,
        string $language,
        array $context
    ): array {
        $isEn = str_starts_with(strtolower($language), 'en');

        return [
            'summary' => $isEn
                ? '[Mock LLM] Strong match on core backend technologies and software engineering experience.'
                : '[Mock LLM] Высокое совпадение по основным технологиям разработки и релевантному опыту.',
            'dimensionScores' => [
                'requiredTechnicalSkills' => 85,
                'relevantExperience' => 80,
                'seniority' => 85,
                'optionalTechnicalSkills' => 70,
                'domainExperience' => 75,
            ],
            'overallScore' => 81,
            'matchedRequirements' => [],
            'missingRequirements' => [],
            'criticalGaps' => [],
            'actionableRecommendations' => [],
        ];
    }

    public function adaptCv(
        string $cvText,
        string $vacancyText,
        string $language,
        array $context
    ): array {
        return [
            'name' => '[PERSON_NAME]',
            'headline' => 'Software Engineer',
            'summary' => '[Mock LLM] Tailored CV summary for target vacancy.',
            'contact' => [
                'email' => 'candidate@anonymized.local',
                'phone' => '[PHONE]',
                'location' => ['city' => null, 'country' => 'Unspecified'],
                'links' => [],
            ],
            'experience' => [],
            'education' => [],
            'skills' => ['Python', 'Docker', 'PostgreSQL'],
        ];
    }

    public function extractRequirements(
        string $vacancyText,
        string $language,
        array $context
    ): array {
        return [
            'required_technical_skills' => ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
            'optional_technical_skills' => ['Redis', 'Kubernetes'],
            'required_experience_years' => 3.0,
            'seniority_level' => 'middle',
            'domain_keywords' => ['Backend', 'Web services'],
            'key_responsibilities' => ['Develop scalable microservices', 'Optimize database queries'],
        ];
    }
}
