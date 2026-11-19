<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\ApiKey;
use App\Entity\AppSetting;
use App\Entity\ApprovedCV;
use App\Entity\ExchangeRate;
use App\Entity\User;
use App\Entity\UserFeatureFlag;
use App\Entity\UserSetting;
use App\Entity\Vacancy;
use App\Entity\VacancyCVAnalysis;
use App\Entity\VacancyStatusHistory;
use Doctrine\DBAL\DriverManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:migrate-legacy-data',
    description: 'Migrate legacy SQLite/PostgreSQL data into the Symfony database without loss.'
)]
class MigrateLegacyDataCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure(): void
    {
        $this->addOption(
            'legacy-dsn',
            null,
            InputOption::VALUE_REQUIRED,
            'Legacy database connection string (e.g. sqlite:///path/to/data.db or postgresql://user:pass@host/db)'
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $legacyDsn = $input->getOption('legacy-dsn');

        if ($legacyDsn === null || trim((string)$legacyDsn) === '') {
            $io->error('The --legacy-dsn option is required.');
            return Command::FAILURE;
        }

        $io->title('Migrating Legacy Data to Symfony Backend');

        $legacyConn = DriverManager::getConnection(['url' => $legacyDsn]);
        $schemaManager = $legacyConn->createSchemaManager();
        $tables = $schemaManager->listTableNames();

        $io->info(sprintf('Connected to legacy database. Found tables: %s', implode(', ', $tables)));

        // 1. Migrate Users
        $userMap = []; // legacy_id => User entity
        if (in_array('users', $tables, true)) {
            $legacyUsers = $legacyConn->fetchAllAssociative('SELECT * FROM users ORDER BY id ASC');
            $io->section(sprintf('Migrating %d users...', count($legacyUsers)));

            foreach ($legacyUsers as $row) {
                $now = new \DateTimeImmutable($row['created_at'] ?? 'now');
                $roles = ['ROLE_USER'];
                if (!empty($row['is_admin'])) {
                    $roles[] = 'ROLE_ADMIN';
                }

                $user = new User(
                    (string)$row['email'],
                    $row['name'] !== null ? (string)$row['name'] : null,
                    $row['avatar'] !== null ? (string)$row['avatar'] : null,
                    $roles,
                    $now
                );

                $this->entityManager->persist($user);
                $userMap[(int)$row['id']] = $user;
            }
            $this->entityManager->flush();
            $io->success('Users migrated.');
        }

        // 2. Migrate User Feature Flags
        if (in_array('user_feature_flags', $tables, true)) {
            $flags = $legacyConn->fetchAllAssociative('SELECT * FROM user_feature_flags');
            foreach ($flags as $row) {
                $user = $userMap[(int)$row['user_id']] ?? null;
                if ($user !== null) {
                    $createdAt = new \DateTimeImmutable($row['created_at'] ?? 'now');
                    $flag = new UserFeatureFlag($user, (string)$row['flag'], $createdAt);
                    $this->entityManager->persist($flag);
                }
            }
            $this->entityManager->flush();
        }

        // 3. Migrate User Settings
        if (in_array('user_settings', $tables, true)) {
            $settings = $legacyConn->fetchAllAssociative('SELECT * FROM user_settings');
            foreach ($settings as $row) {
                $user = $userMap[(int)$row['user_id']] ?? null;
                if ($user !== null) {
                    $updatedAt = new \DateTimeImmutable($row['updated_at'] ?? 'now');
                    $setting = new UserSetting($user, (string)$row['key'], $row['value'] !== null ? (string)$row['value'] : null, $updatedAt);
                    $this->entityManager->persist($setting);
                }
            }
            $this->entityManager->flush();
        }

        // 4. Migrate Vacancies
        $vacancyMap = [];
        if (in_array('vacancies', $tables, true)) {
            $vacancies = $legacyConn->fetchAllAssociative('SELECT * FROM vacancies ORDER BY id ASC');
            $io->section(sprintf('Migrating %d vacancies...', count($vacancies)));

            foreach ($vacancies as $row) {
                $now = new \DateTimeImmutable($row['created_at'] ?? 'now');
                $techStack = isset($row['tech_stack']) ? json_decode((string)$row['tech_stack'], true) : [];
                $tags = isset($row['tags']) ? json_decode((string)$row['tags'], true) : [];

                $vacancy = new Vacancy(
                    (string)$row['url'],
                    (string)($row['title'] ?? 'Untitled Vacancy'),
                    (string)($row['company'] ?? 'Unknown Company'),
                    (string)($row['status'] ?? Vacancy::STATUS_NOT_CONTACTED),
                    !empty($row['is_closed']),
                    (int)($row['lane'] ?? 0),
                    is_array($techStack) ? $techStack : [],
                    is_array($tags) ? $tags : [],
                    $now
                );

                if (!empty($row['user_id']) && isset($userMap[(int)$row['user_id']])) {
                    $vacancy->setUser($userMap[(int)$row['user_id']]);
                }

                $vacancy->setJobId($row['job_id'] ?? null);
                $vacancy->setCompanyUrl($row['company_url'] ?? null);
                $vacancy->setCompanyInfo($row['company_info'] ?? null);
                $vacancy->setSource($row['source'] ?? null);
                $vacancy->setLocation($row['location'] ?? null);
                $vacancy->setCity($row['city'] ?? null);
                $vacancy->setCountry($row['country'] ?? null);
                $vacancy->setDescription($row['description'] ?? null);
                $vacancy->setWorkplaceType($row['workplace_type'] ?? null);
                $vacancy->setSalaryMin(isset($row['salary_min']) ? (float)$row['salary_min'] : null);
                $vacancy->setSalaryMax(isset($row['salary_max']) ? (float)$row['salary_max'] : null);
                $vacancy->setSalaryCurrency($row['salary_currency'] ?? null);
                $vacancy->setSalaryPeriod($row['salary_period'] ?? null);
                $vacancy->setAiSummary($row['ai_summary'] ?? null);
                $vacancy->setNotes($row['notes'] ?? null);
                $vacancy->setSortOrder(isset($row['sort_order']) ? (float)$row['sort_order'] : null);

                $this->entityManager->persist($vacancy);
                $vacancyMap[(int)$row['id']] = $vacancy;
            }
            $this->entityManager->flush();
            $io->success('Vacancies migrated.');
        }

        // 5. Migrate Status History
        if (in_array('vacancy_status_history', $tables, true)) {
            $historyRows = $legacyConn->fetchAllAssociative('SELECT * FROM vacancy_status_history');
            foreach ($historyRows as $row) {
                $vacancy = $vacancyMap[(int)$row['vacancy_id']] ?? null;
                if ($vacancy !== null) {
                    $now = new \DateTimeImmutable($row['created_at'] ?? 'now');
                    $history = new VacancyStatusHistory(
                        $vacancy,
                        $row['from_status'] ?? null,
                        (string)$row['to_status'],
                        isset($row['from_lane']) ? (int)$row['from_lane'] : null,
                        isset($row['to_lane']) ? (int)$row['to_lane'] : null,
                        $row['comment'] ?? null,
                        $now
                    );
                    $this->entityManager->persist($history);
                }
            }
            $this->entityManager->flush();
        }

        // 6. Migrate App Settings
        if (in_array('settings', $tables, true)) {
            $settings = $legacyConn->fetchAllAssociative('SELECT * FROM settings');
            foreach ($settings as $row) {
                $now = new \DateTimeImmutable($row['updated_at'] ?? 'now');
                $appSetting = new AppSetting((string)$row['key'], $row['value'] ?? null, $now);
                $this->entityManager->persist($appSetting);
            }
            $this->entityManager->flush();
        }

        $io->success('All legacy data successfully imported into Symfony database without loss!');
        return Command::SUCCESS;
    }
}
