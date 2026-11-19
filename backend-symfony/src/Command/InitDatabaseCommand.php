<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\ApiKey;
use App\Entity\AppSetting;
use App\Entity\ExchangeRate;
use App\Entity\User;
use App\Entity\UserFeatureFlag;
use App\Entity\Vacancy;
use App\Entity\VacancyStatusHistory;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:init-database',
    description: 'Initialize database schema, configure admin users, and populate mock data if requested.'
)]
class InitDatabaseCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure(): void
    {
        $this->addOption('mock-data', null, InputOption::VALUE_NONE, 'Seed mock vacancies and fixtures');
        $this->addOption('admin-email', null, InputOption::VALUE_REQUIRED, 'Admin email to grant admin permissions');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Initializing Application Database');

        // 1. Ensure Schema
        $io->section('Updating Database Schema...');
        $metadata = $this->entityManager->getMetadataFactory()->getAllMetadata();
        $schemaTool = new SchemaTool($this->entityManager);
        $schemaTool->updateSchema($metadata, true);
        $io->success('Schema up to date.');

        $now = new \DateTimeImmutable();

        // 2. Admin Users Resolution
        $adminEmailOption = $input->getOption('admin-email');
        $adminEmailsEnv = isset($_ENV['ADMIN_EMAILS']) ? (string)$_ENV['ADMIN_EMAILS'] : (isset($_SERVER['ADMIN_EMAILS']) ? (string)$_SERVER['ADMIN_EMAILS'] : '');
        $adminRaw = $adminEmailOption !== null ? (string)$adminEmailOption : $adminEmailsEnv;

        $adminEmails = [];
        if ($adminRaw !== '') {
            foreach (explode(',', $adminRaw) as $item) {
                $e = strtolower(trim($item));
                if ($e !== '') {
                    $adminEmails[] = $e;
                }
            }
        }

        if (count($adminEmails) === 0) {
            $adminEmails[] = 'dkoldyaev@gmail.com';
        }

        $userRepo = $this->entityManager->getRepository(User::class);
        $flagRepo = $this->entityManager->getRepository(UserFeatureFlag::class);
        $apiKeyRepo = $this->entityManager->getRepository(ApiKey::class);

        $adminUsers = [];

        foreach ($adminEmails as $email) {
            /** @var User|null $user */
            $user = $userRepo->findOneBy(['email' => $email]);
            $nameParts = explode('@', $email);
            $userName = count($nameParts) > 0 ? (string)$nameParts[0] : $email;

            if ($user === null) {
                $user = new User(
                    $email,
                    $userName,
                    sprintf('https://api.dicebear.com/7.x/bottts/svg?seed=%s', substr(md5($email), 0, 8)),
                    true,
                    ['ROLE_USER', 'ROLE_ADMIN'],
                    $now
                );
                $this->entityManager->persist($user);
                $this->entityManager->flush();
                $io->info(sprintf('Created admin user: %s (ID: %d)', $email, (int)$user->getId()));
            } else {
                $user->setIsAdmin(true);
                $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
                $this->entityManager->flush();
                $io->info(sprintf('Updated existing user with admin privileges: %s (ID: %d)', $email, (int)$user->getId()));
            }

            // Ensure feature flags
            foreach (['admin', 'api_access'] as $flag) {
                $existingFlag = $flagRepo->findOneBy(['user' => $user, 'flag' => $flag]);
                if ($existingFlag === null) {
                    $uff = new UserFeatureFlag($user, $flag, $now);
                    $this->entityManager->persist($uff);
                }
            }

            // Ensure primary API key
            $existingKey = $apiKeyRepo->findOneBy(['user' => $user]);
            if ($existingKey === null) {
                $hash = hash('sha256', sprintf('lp_key_%s_%s', $user->getEmail(), (string)$now->getTimestamp()));
                $apiKey = new ApiKey($user, $hash, 'Main Admin Key', 'lp_admin', $now);
                $this->entityManager->persist($apiKey);
            }

            $this->entityManager->flush();
            $adminUsers[] = $user;
        }

        // 3. Mock Data Seeding if requested
        $mockDataOption = $input->getOption('mock-data');
        $createMockDataEnv = isset($_ENV['CREATE_MOCK_DATA']) ? (string)$_ENV['CREATE_MOCK_DATA'] : (isset($_SERVER['CREATE_MOCK_DATA']) ? (string)$_SERVER['CREATE_MOCK_DATA'] : 'false');
        $shouldSeedMock = $mockDataOption || in_array(strtolower($createMockDataEnv), ['true', '1', 'yes'], true);

        if ($shouldSeedMock) {
            $io->section('Seeding Mock Data...');
            $vacancyRepo = $this->entityManager->getRepository(Vacancy::class);
            $existingCount = $vacancyRepo->count([]);

            if ($existingCount === 0 && count($adminUsers) > 0) {
                $primaryAdmin = $adminUsers[0];

                $mockVacancies = [
                    [
                        'url' => 'https://example.com/jobs/1',
                        'title' => 'Senior Backend Engineer',
                        'company' => 'Initech',
                        'jobId' => 'job-001',
                        'source' => 'LinkedIn',
                        'location' => 'Berlin, Germany',
                        'city' => 'Berlin',
                        'country' => 'Germany',
                        'workplaceType' => 'remote',
                        'isClosed' => false,
                        'salaryMin' => 5000.0,
                        'salaryMax' => 7500.0,
                        'salaryCurrency' => 'EUR',
                        'salaryPeriod' => 'month',
                        'aiSummary' => 'Backend services at Initech. Stack: Python, PostgreSQL, Docker.',
                        'techStack' => ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
                        'status' => 'Еще не написал',
                        'tags' => ['priority', 'backend'],
                        'lane' => 0,
                        'sortOrder' => 1.0,
                    ],
                    [
                        'url' => 'https://example.com/jobs/2',
                        'title' => 'Fullstack Developer',
                        'company' => 'Acme Corp',
                        'jobId' => 'job-002',
                        'source' => 'LinkedIn',
                        'location' => 'Amsterdam, Netherlands',
                        'city' => 'Amsterdam',
                        'country' => 'Netherlands',
                        'workplaceType' => 'hybrid',
                        'isClosed' => false,
                        'salaryMin' => 6000.0,
                        'salaryMax' => 8000.0,
                        'salaryCurrency' => 'EUR',
                        'salaryPeriod' => 'month',
                        'aiSummary' => 'Fullstack web development at Acme Corp. Stack: React, TypeScript, FastAPI.',
                        'techStack' => ['React', 'TypeScript', 'Python', 'FastAPI'],
                        'status' => 'Написал',
                        'tags' => ['fullstack'],
                        'lane' => 0,
                        'sortOrder' => 2.0,
                    ],
                    [
                        'url' => 'https://example.com/jobs/3',
                        'title' => 'DevOps / Platform Engineer',
                        'company' => 'Globex Corporation',
                        'jobId' => 'job-003',
                        'source' => 'LinkedIn',
                        'location' => 'London, UK',
                        'city' => 'London',
                        'country' => 'United Kingdom',
                        'workplaceType' => 'remote',
                        'isClosed' => false,
                        'salaryMin' => 7000.0,
                        'salaryMax' => 9500.0,
                        'salaryCurrency' => 'GBP',
                        'salaryPeriod' => 'month',
                        'aiSummary' => 'Kubernetes, Terraform, CI/CD pipelines.',
                        'techStack' => ['Kubernetes', 'Terraform', 'Docker', 'AWS'],
                        'status' => 'Собеседование',
                        'tags' => ['devops', 'infra'],
                        'lane' => 1,
                        'sortOrder' => 3.0,
                    ],
                    [
                        'url' => 'https://example.com/jobs/4',
                        'title' => 'Lead Python Developer',
                        'company' => 'Stark Industries',
                        'jobId' => 'job-004',
                        'source' => 'Indeed',
                        'location' => 'New York, USA',
                        'city' => 'New York',
                        'country' => 'United States',
                        'workplaceType' => 'on-site',
                        'isClosed' => false,
                        'salaryMin' => 12000.0,
                        'salaryMax' => 16000.0,
                        'salaryCurrency' => 'USD',
                        'salaryPeriod' => 'month',
                        'aiSummary' => 'High-load architectures and distributed databases.',
                        'techStack' => ['Python', 'PostgreSQL', 'Redis', 'Kafka'],
                        'status' => 'Тестовое',
                        'tags' => ['lead', 'architecture'],
                        'lane' => 0,
                        'sortOrder' => 4.0,
                    ],
                    [
                        'url' => 'https://example.com/jobs/5',
                        'title' => 'Senior Machine Learning Engineer',
                        'company' => 'Wayne Enterprises',
                        'jobId' => 'job-005',
                        'source' => 'LinkedIn',
                        'location' => 'Austin, USA',
                        'city' => 'Austin',
                        'country' => 'United States',
                        'workplaceType' => 'remote',
                        'isClosed' => false,
                        'salaryMin' => 13000.0,
                        'salaryMax' => 18000.0,
                        'salaryCurrency' => 'USD',
                        'salaryPeriod' => 'month',
                        'aiSummary' => 'LLM evaluation, RAG pipelines, fine-tuning.',
                        'techStack' => ['PyTorch', 'Python', 'vLLM', 'HuggingFace'],
                        'status' => 'Оффер',
                        'tags' => ['ai', 'ml'],
                        'lane' => 0,
                        'sortOrder' => 5.0,
                    ],
                    [
                        'url' => 'https://example.com/jobs/6',
                        'title' => 'Junior QA Engineer',
                        'company' => 'Hooli',
                        'jobId' => 'job-006',
                        'source' => 'hh.ru',
                        'location' => 'Berlin, Germany',
                        'city' => 'Berlin',
                        'country' => 'Germany',
                        'workplaceType' => 'on-site',
                        'isClosed' => true,
                        'salaryMin' => 3000.0,
                        'salaryMax' => 4000.0,
                        'salaryCurrency' => 'EUR',
                        'salaryPeriod' => 'month',
                        'aiSummary' => 'QA at Hooli.',
                        'techStack' => ['Python', 'Pytest', 'Selenium'],
                        'status' => 'Отказ',
                        'tags' => [],
                        'lane' => 0,
                        'sortOrder' => 6.0,
                    ],
                ];

                foreach ($mockVacancies as $mv) {
                    $v = new Vacancy(
                        $mv['url'],
                        $mv['title'],
                        $mv['company'],
                        $mv['status'],
                        $mv['isClosed'],
                        $mv['lane'],
                        $mv['techStack'],
                        $mv['tags'],
                        $now
                    );
                    $v->setUser($primaryAdmin);
                    $v->setJobId($mv['jobId']);
                    $v->setSource($mv['source']);
                    $v->setLocation($mv['location']);
                    $v->setCity($mv['city']);
                    $v->setCountry($mv['country']);
                    $v->setWorkplaceType($mv['workplaceType']);
                    $v->setSalaryMin($mv['salaryMin']);
                    $v->setSalaryMax($mv['salaryMax']);
                    $v->setSalaryCurrency($mv['salaryCurrency']);
                    $v->setSalaryPeriod($mv['salaryPeriod']);
                    $v->setAiSummary($mv['aiSummary']);
                    $v->setSortOrder($mv['sortOrder']);

                    $this->entityManager->persist($v);

                    $h = new VacancyStatusHistory($v, null, $mv['status'], null, null, null, $now);
                    $this->entityManager->persist($h);
                }

                // Default settings
                $settingRepo = $this->entityManager->getRepository(AppSetting::class);
                if ($settingRepo->findOneBy(['key' => 'salary_display_format']) === null) {
                    $setting = new AppSetting('salary_display_format', 'month', $now);
                    $this->entityManager->persist($setting);
                }

                // Exchange rates
                $rateRepo = $this->entityManager->getRepository(ExchangeRate::class);
                if ($rateRepo->count([]) === 0) {
                    $this->entityManager->persist(new ExchangeRate('USD', 'EUR', 0.92, $now));
                    $this->entityManager->persist(new ExchangeRate('EUR', 'USD', 1.09, $now));
                    $this->entityManager->persist(new ExchangeRate('GBP', 'EUR', 1.17, $now));
                }

                $this->entityManager->flush();
                $io->success(sprintf('Seeded %d mock vacancies for %s.', count($mockVacancies), $primaryAdmin->getEmail()));
            } else {
                $io->info('Mock data already exists, skipping.');
            }
        }

        $io->success('Database initialized successfully!');
        return Command::SUCCESS;
    }
}
