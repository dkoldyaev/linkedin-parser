<?php

declare(strict_types=1);

namespace App\Service\Llm;

interface LlmProviderInterface
{
    public function getName(): string;

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function summarizeVacancy(
        string $title,
        string $company,
        string $description,
        string $location,
        string $language,
        array $context
    ): array;

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function evaluateCompatibility(
        string $vacancyText,
        string $cvText,
        string $language,
        array $context
    ): array;

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function adaptCv(
        string $cvText,
        string $vacancyText,
        string $language,
        array $context
    ): array;

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    public function extractRequirements(
        string $vacancyText,
        string $language,
        array $context
    ): array;
}
