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
                ? '[Mock LLM] Strong match on core backend technologies and software engineering experience. Some optional infrastructure and domain-specific requirements remain unconfirmed in the CV.'
                : '[Mock LLM] Высокое совпадение по основным технологиям разработки и релевантному опыту. Ряд дополнительных инфраструктурных и доменных требований в резюме явно не подтверждён.',
            'dimensionScores' => [
                'requiredTechnicalSkills' => 88,
                'relevantProfessionalExperience' => 84,
                'relevantExperience' => 84,
                'seniorityAlignment' => 85,
                'seniority' => 85,
                'optionalTechnicalSkills' => 70,
                'domainExperience' => 75,
            ],
            'overallScore' => 81,
            'calculatedScore' => 81,
            'seniorityAssessment' => [
                'status' => 'partially_matched',
                'comment' => $isEn
                    ? 'Candidate demonstrates Senior-level engineering experience and architecture ownership, though direct domain-specific experience in the target vertical is not explicitly detailed.'
                    : 'Кандидат демонстрирует уверенный опыт уровня Senior и проектирование архитектуры, однако прямой опыт в целевой предметной области явно не детализирован.',
            ],
            'matchedRequirements' => $isEn
                ? [
                    [
                        'requirement' => 'Production backend development and REST / gRPC API design (5+ years)',
                        'evidence' => 'CV quote: "Designed and maintained high-throughput microservices and REST/gRPC APIs handling up to 12,000 RPS in production."',
                    ],
                    [
                        'requirement' => 'Relational database optimization and PostgreSQL schema design',
                        'evidence' => 'CV quote: "Optimized PostgreSQL queries, indexing strategies, and partitioned multi-terabyte transactional tables, reducing p99 latency by 70%."',
                    ],
                    [
                        'requirement' => 'Containerization with Docker and automated CI/CD pipelines',
                        'evidence' => 'CV quote: "Built Docker multi-stage deployments and automated CI/CD workflows with GitHub Actions and GitLab CI."',
                    ],
                    [
                        'requirement' => 'Asynchronous processing, caching (Redis), and message brokers (Kafka / RabbitMQ)',
                        'evidence' => 'CV quote: "Implemented event-driven background workers and distributed caching using Redis and Apache Kafka."',
                    ],
                    [
                        'requirement' => 'Automated testing, code reviews, and cross-functional collaboration',
                        'evidence' => 'CV quote: "Maintained 85%+ unit and integration test coverage and led architectural reviews across product squads."',
                    ],
                ]
                : [
                    [
                        'requirement' => 'Разработка высоконагруженных сервисов и проектирование REST / gRPC API (5+ лет)',
                        'evidence' => 'Цитата из CV: «Спроектировал и вывел в продакшен микросервисы и REST/gRPC API с пиковой нагрузкой до 12 000 RPS».',
                    ],
                    [
                        'requirement' => 'Оптимизация реляционных БД и проектирование схем PostgreSQL',
                        'evidence' => 'Цитата из CV: «Оптимизация сложных SQL-запросов, индексов и партиционирование таблиц в PostgreSQL, снижение p99 latency на 70%».',
                    ],
                    [
                        'requirement' => 'Контейнеризация (Docker) и настройка CI/CD пайплайнов',
                        'evidence' => 'Цитата из CV: «Настройка multi-stage сборок Docker и автоматизация релизных пайплайнов в GitHub Actions и GitLab CI».',
                    ],
                    [
                        'requirement' => 'Асинхронная обработка, кэширование (Redis) и брокеры сообщений (Kafka / RabbitMQ)',
                        'evidence' => 'Цитата из CV: «Реализация событийно-ориентированных воркеров и распределенного кэширования на базе Redis и Apache Kafka».',
                    ],
                    [
                        'requirement' => 'Автоматизированное тестирование, код-ревью и кросс-функциональное взаимодействие',
                        'evidence' => 'Цитата из CV: «Поддержка покрытия unit и интеграционными тестами выше 85%, проведение архитектурных ревью в продуктовых командах».',
                    ],
                ],
            'missingRequirements' => $isEn
                ? [
                    [
                        'requirement' => 'Infrastructure as Code with Terraform and multi-region Kubernetes (EKS) operations',
                        'severity' => 'medium',
                        'reason' => 'The CV mentions Docker and Kubernetes deployments, but hands-on authoring of Terraform modules is not explicitly confirmed.',
                    ],
                    [
                        'requirement' => 'Observability stack configuration with OpenTelemetry and Grafana Faro / Prometheus',
                        'severity' => 'low',
                        'reason' => 'Production monitoring is referenced in general terms, without explicitly naming OpenTelemetry or custom Prometheus exporters.',
                    ],
                    [
                        'requirement' => 'Industry compliance and security certification audits (PCI DSS / SOC 2)',
                        'severity' => 'low',
                        'reason' => 'Security best practices are mentioned, but participation in formal compliance audits is not stated in the CV.',
                    ],
                ]
                : [
                    [
                        'requirement' => 'Управление инфраструктурой как кодом (Terraform) и администрирование multi-region кластеров Kubernetes',
                        'severity' => 'medium',
                        'reason' => 'В резюме описан деплой в Docker и Kubernetes, но практический опыт написания Terraform-модулей явно не подтверждён.',
                    ],
                    [
                        'requirement' => 'Глубокая настройка распределённого трейсинга (OpenTelemetry, Prometheus / Grafana)',
                        'severity' => 'low',
                        'reason' => 'Упомянут мониторинг и логирование в продакшене, однако настройка OpenTelemetry и кастомных метрик прямо не указана.',
                    ],
                    [
                        'requirement' => 'Опыт прохождения сертификации и аудитов безопасности (PCI DSS / SOC 2)',
                        'severity' => 'low',
                        'reason' => 'Описана разработка защищённых API, но формальное участие в сертификационных аудитах в резюме не отражено.',
                    ],
                ],
            'criticalGaps' => $isEn
                ? [
                    [
                        'requirement' => 'Mandatory hybrid office attendance (3 days/week on-site)',
                        'reason' => 'The candidate CV specifies full-remote preference or a different city; relocation or remote work agreement will be required.',
                    ],
                ]
                : [
                    [
                        'requirement' => 'Обязательное присутствие в локальном офисе (гибридный график 3 дня в неделю)',
                        'reason' => 'В резюме указан формат Full Remote и другая локация — потребуется релокация или индивидуальное согласование удалённой работы.',
                    ],
                ],
            'recommendations' => $isEn
                ? [
                    'Highlight throughput, latency, and database scale metrics in the first bullet points of your recent roles.',
                    'Explicitly list infrastructure and observability tools (Terraform, Helm, OpenTelemetry, Prometheus) used alongside Docker and Kubernetes.',
                    'Add context on domain compliance, SLA guarantees (e.g., 99.99% uptime), and on-call / incident response ownership.',
                ]
                : [
                    'Вынесите ключевые метрики нагрузки (RPS, latency, объём БД PostgreSQL) в первые пункты описания последнего места работы.',
                    'Явно укажите используемые инструменты инфраструктуры и наблюдаемости (Terraform, Helm, OpenTelemetry, Prometheus) рядом с Docker и Kubernetes.',
                    'Добавьте контекст по стандартам безопасности, SLA (например, 99.99% uptime) и участию в дежурствах / разборе инцидентов.',
                ],
            'actionableRecommendations' => $isEn
                ? [
                    'Highlight throughput, latency, and database scale metrics in the first bullet points of your recent roles.',
                    'Explicitly list infrastructure and observability tools (Terraform, Helm, OpenTelemetry, Prometheus) used alongside Docker and Kubernetes.',
                    'Add context on domain compliance, SLA guarantees (e.g., 99.99% uptime), and on-call / incident response ownership.',
                ]
                : [
                    'Вынесите ключевые метрики нагрузки (RPS, latency, объём БД PostgreSQL) в первые пункты описания последнего места работы.',
                    'Явно укажите используемые инструменты инфраструктуры и наблюдаемости (Terraform, Helm, OpenTelemetry, Prometheus) рядом с Docker и Kubernetes.',
                    'Добавьте контекст по стандартам безопасности, SLA (например, 99.99% uptime) и участию в дежурствах / разборе инцидентов.',
                ],
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
