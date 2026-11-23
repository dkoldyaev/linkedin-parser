<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration to clean up and normalize salary and nullable fields in vacancies.
 */
final class Version20261123201809 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Clean up and normalize salary data and empty string values in vacancies table';
    }

    public function up(Schema $schema): void
    {
        // 1. Clean up invalid/zero salary values
        $this->addSql('UPDATE vacancies SET salary_min = NULL WHERE salary_min <= 0');
        $this->addSql('UPDATE vacancies SET salary_max = NULL WHERE salary_max <= 0');

        // 2. Fix inverted salary ranges where min > max
        $this->addSql('UPDATE vacancies SET salary_min = salary_max, salary_max = salary_min WHERE salary_min IS NOT NULL AND salary_max IS NOT NULL AND salary_min > salary_max');

        // 3. Normalize empty string or whitespace-only salary strings to NULL
        $this->addSql("UPDATE vacancies SET salary_currency = NULL WHERE salary_currency IS NOT NULL AND BTRIM(salary_currency) = ''");
        $this->addSql("UPDATE vacancies SET salary_period = NULL WHERE salary_period IS NOT NULL AND BTRIM(salary_period) = ''");

        // 4. Normalize uppercase currency codes
        $this->addSql("UPDATE vacancies SET salary_currency = UPPER(BTRIM(salary_currency)) WHERE salary_currency IS NOT NULL");

        // 5. Normalize period strings to lowercase
        $this->addSql("UPDATE vacancies SET salary_period = LOWER(BTRIM(salary_period)) WHERE salary_period IS NOT NULL");

        // 6. If both salary_min and salary_max are NULL, clear dangling salary_currency and salary_period if meaningless
        $this->addSql("UPDATE vacancies SET salary_currency = NULL, salary_period = NULL WHERE salary_min IS NULL AND salary_max IS NULL AND (salary_currency IS NULL OR salary_period IS NULL)");

        // 7. Clean up other optional fields with empty strings
        $this->addSql("UPDATE vacancies SET workplace_type = NULL WHERE workplace_type IS NOT NULL AND BTRIM(workplace_type) = ''");
        $this->addSql("UPDATE vacancies SET company_url = NULL WHERE company_url IS NOT NULL AND BTRIM(company_url) = ''");
        $this->addSql("UPDATE vacancies SET company_info = NULL WHERE company_info IS NOT NULL AND BTRIM(company_info) = ''");
        $this->addSql("UPDATE vacancies SET location = NULL WHERE location IS NOT NULL AND BTRIM(location) = ''");
        $this->addSql("UPDATE vacancies SET city = NULL WHERE city IS NOT NULL AND BTRIM(city) = ''");
        $this->addSql("UPDATE vacancies SET country = NULL WHERE country IS NOT NULL AND BTRIM(country) = ''");
        $this->addSql("UPDATE vacancies SET notes = NULL WHERE notes IS NOT NULL AND BTRIM(notes) = ''");
        $this->addSql("UPDATE vacancies SET ai_summary = NULL WHERE ai_summary IS NOT NULL AND BTRIM(ai_summary) = ''");
    }

    public function down(Schema $schema): void
    {
        // Data cleanup migration is irreversible as it eliminates dirty/invalid data.
    }
}
