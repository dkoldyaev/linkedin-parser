<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\ApiKey;
use App\Entity\AppSetting;
use App\Entity\ExchangeRate;
use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\UserFeatureFlag;
use App\Entity\UserLLMTokenUsage;
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
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:init-database',
    description: 'Initialize database schema, configure admin users, and populate mock data if requested.'
)]
class InitDatabaseCommand extends Command
{
    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(EntityManagerInterface $entityManager, UserPasswordHasherInterface $passwordHasher)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
        $this->passwordHasher = $passwordHasher;
    }

    protected function configure(): void
    {
        $this->addOption('mock-data', null, InputOption::VALUE_NONE, 'Seed mock vacancies and fixtures');
        $this->addOption('admin-email', null, InputOption::VALUE_REQUIRED, 'Admin email to grant admin permissions');
        $this->addOption('admin-password', null, InputOption::VALUE_REQUIRED, 'Admin password to set for admin accounts');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Initializing Application Database');

        // 1. Ensure Schema
        $io->section('Updating Database Schema...');
        try {
            $conn = $this->entityManager->getConnection();
            $conn->executeStatement("DO \$\$ BEGIN BEGIN ALTER TABLE vacancy_cv_analyses ADD COLUMN is_outdated BOOLEAN DEFAULT false NOT NULL; EXCEPTION WHEN duplicate_column THEN UPDATE vacancy_cv_analyses SET is_outdated = false WHERE is_outdated IS NULL; END; END \$\$;");
        } catch (\Throwable) {
            try {
                $conn = $this->entityManager->getConnection();
                $conn->executeStatement("UPDATE vacancy_cv_analyses SET is_outdated = 0 WHERE is_outdated IS NULL");
            } catch (\Throwable) {
            }
        }
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

        $adminPasswordOption = $input->getOption('admin-password');
        $adminPasswordEnv = isset($_ENV['ADMIN_PASSWORD']) ? (string)$_ENV['ADMIN_PASSWORD'] : (isset($_SERVER['ADMIN_PASSWORD']) ? (string)$_SERVER['ADMIN_PASSWORD'] : '');
        $adminPassword = $adminPasswordOption !== null && (string)$adminPasswordOption !== ''
            ? (string)$adminPasswordOption
            : ($adminPasswordEnv !== '' ? $adminPasswordEnv : 'AdminSecure2026!#');

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
                $user->setPassword($this->passwordHasher->hashPassword($user, $adminPassword));
                $this->entityManager->persist($user);
                $this->entityManager->flush();
                $io->info(sprintf('Created admin user: %s (ID: %d)', $email, (int)$user->getId()));
            } else {
                $user->setIsAdmin(true);
                $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
                $user->setPassword($this->passwordHasher->hashPassword($user, $adminPassword));
                $this->entityManager->flush();
                $io->info(sprintf('Updated existing user with admin privileges and password: %s (ID: %d)', $email, (int)$user->getId()));
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
                    $v = new Vacancy();
                    $v->setUrl($mv['url']);
                    $v->setTitle($mv['title']);
                    $v->setCompany($mv['company']);
                    $v->setStatus($mv['status']);
                    $v->setIsClosed($mv['isClosed']);
                    $v->setLane($mv['lane']);
                    $v->setTechStack($mv['techStack']);
                    $v->setTags($mv['tags']);
                    $v->setCreatedAt($now);
                    $v->setUpdatedAt($now);
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
            }

            if (count($adminUsers) > 0) {
                $primaryAdmin = $adminUsers[0];

                // LLM Token Usages mock seeding
                $tokenUsageRepo = $this->entityManager->getRepository(UserLLMTokenUsage::class);
                if ($tokenUsageRepo->count([]) === 0) {
                    $this->entityManager->persist(new UserLLMTokenUsage(
                        $primaryAdmin,
                        'gemini',
                        'gemini-2.5-flash',
                        12400,
                        3200,
                        15600,
                        $now->modify('-2 hours')
                    ));
                    $this->entityManager->persist(new UserLLMTokenUsage(
                        $primaryAdmin,
                        'gemini',
                        'gemini-2.5-flash',
                        8500,
                        1900,
                        10400,
                        $now->modify('-1 hour')
                    ));
                    $this->entityManager->persist(new UserLLMTokenUsage(
                        $primaryAdmin,
                        'mistral',
                        'mistral-small-latest',
                        18200,
                        4600,
                        22800,
                        $now->modify('-30 minutes')
                    ));
                    $io->success('Seeded mock LLM token usage entries.');
                }

                // Processing queue items mock seeding
                $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);
                if ($queueRepo->count([]) === 0) {
                    $item1 = new ProcessingQueueItem(
                        'task-' . bin2hex(random_bytes(6)),
                        'https://www.linkedin.com/jobs/view/4100000001/',
                        'pending',
                        'queued',
                        0,
                        $now->modify('-10 minutes')
                    );
                    $item1->setUser($primaryAdmin);
                    $item1->setPriority(5);
                    $this->entityManager->persist($item1);

                    $item2 = new ProcessingQueueItem(
                        'task-' . bin2hex(random_bytes(6)),
                        'https://www.linkedin.com/jobs/view/4100000002/',
                        'processing',
                        'scraping',
                        1,
                        $now->modify('-5 minutes')
                    );
                    $item2->setUser($primaryAdmin);
                    $item2->setPriority(10);
                    $this->entityManager->persist($item2);

                    $item3 = new ProcessingQueueItem(
                        'task-' . bin2hex(random_bytes(6)),
                        'https://www.linkedin.com/jobs/view/4100000003/',
                        'failed',
                        'failed',
                        4,
                        $now->modify('-20 minutes')
                    );
                    $item3->setUser($primaryAdmin);
                    $item3->setError('HTTP 429 Too Many Requests: LinkedIn rate limit exceeded during scraping stage.');
                    $item3->setPriority(0);
                    $this->entityManager->persist($item3);

                    $item4 = new ProcessingQueueItem(
                        'task-' . bin2hex(random_bytes(6)),
                        'https://www.linkedin.com/jobs/view/4100000004/',
                        'completed',
                        'completed',
                        1,
                        $now->modify('-1 hour')
                    );
                    $item4->setUser($primaryAdmin);
                    $item4->setPriority(0);
                    $this->entityManager->persist($item4);
                    $io->success('Seeded mock processing queue items.');
                }

                $this->entityManager->flush();
            }
        }

        $io->success('Database initialized successfully!');
        return Command::SUCCESS;
    }
}
