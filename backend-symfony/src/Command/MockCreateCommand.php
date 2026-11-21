<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\ExchangeRate;
use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\UserLLMTokenUsage;
use App\Entity\Vacancy;
use App\Entity\VacancyStatusHistory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'mock:create',
    description: 'Create mock vacancies, status history, exchange rates, LLM token usage, and queue items.'
)]
class MockCreateCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure(): void
    {
        $this
            ->addOption('email', null, InputOption::VALUE_REQUIRED, 'Target user email for mock vacancies')
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Seed mock vacancies even if user already has vacancies');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $now = new \DateTimeImmutable();

        $emailOpt = $input->getOption('email');
        $force = (bool)$input->getOption('force');

        $userRepo = $this->entityManager->getRepository(User::class);
        $targetUsers = [];

        if ($emailOpt !== null && trim((string)$emailOpt) !== '') {
            $email = strtolower(trim((string)$emailOpt));
            /** @var User|null $u */
            $u = $userRepo->findOneBy(['email' => $email]);
            if ($u === null) {
                $nameParts = explode('@', $email);
                $u = new User(
                    $email,
                    $nameParts[0] !== '' ? $nameParts[0] : $email,
                    sprintf('https://api.dicebear.com/7.x/bottts/svg?seed=%s', substr(md5($email), 0, 8)),
                    false,
                    ['ROLE_USER'],
                    $now
                );
                $this->entityManager->persist($u);
                $this->entityManager->flush();
            }
            $targetUsers[] = $u;
        } else {
            $admins = $userRepo->findBy(['isAdmin' => true]);
            if (count($admins) > 0) {
                $targetUsers = $admins;
            } else {
                $allUsers = $userRepo->findAll();
                if (count($allUsers) > 0) {
                    $targetUsers = [$allUsers[0]];
                } else {
                    $defaultAdmin = new User(
                        'dkoldyaev@gmail.com',
                        'dkoldyaev',
                        'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
                        true,
                        ['ROLE_USER', 'ROLE_ADMIN'],
                        $now
                    );
                    $this->entityManager->persist($defaultAdmin);
                    $this->entityManager->flush();
                    $targetUsers = [$defaultAdmin];
                }
            }
        }

        $mockVacancies = [
            [
                'url' => 'https://www.linkedin.com/jobs/view/stripe-staff-001',
                'title' => 'Staff Backend Engineer — Payment Infrastructure',
                'company' => 'Stripe',
                'jobId' => 'job-stripe-001',
                'source' => 'LinkedIn',
                'location' => 'Dublin, Ireland',
                'city' => 'Dublin',
                'country' => 'Ireland',
                'workplaceType' => 'remote',
                'isClosed' => false,
                'salaryMin' => 11000.0,
                'salaryMax' => 14500.0,
                'salaryCurrency' => 'EUR',
                'salaryPeriod' => 'month',
                'aiSummary' => 'Distributed payment ledger and high-throughput settlement pipelines in Go and Ruby.',
                'techStack' => ['Go', 'PostgreSQL', 'Kafka', 'Kubernetes'],
                'status' => 'Еще не написал',
                'tags' => ['fintech', 'priority'],
                'lane' => 0,
                'sortOrder' => 0.0,
            ],
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

        $vacancyRepo = $this->entityManager->getRepository(Vacancy::class);

        foreach ($targetUsers as $user) {
            $userVacancyCount = $vacancyRepo->count(['user' => $user]);
            if ($userVacancyCount === 0 || $force) {
                foreach ($mockVacancies as $mv) {
                    $existing = $vacancyRepo->findOneBy(['user' => $user, 'url' => $mv['url']]);
                    if ($existing !== null) {
                        continue;
                    }
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
                    $v->setUser($user);
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
                $this->entityManager->flush();
                $io->success(sprintf('Seeded mock vacancies for %s.', $user->getEmail()));
            }
        }

        // Exchange rates
        $rateRepo = $this->entityManager->getRepository(ExchangeRate::class);
        if ($rateRepo->count([]) === 0) {
            $this->entityManager->persist(new ExchangeRate('USD', 'EUR', 0.92, $now));
            $this->entityManager->persist(new ExchangeRate('EUR', 'USD', 1.09, $now));
            $this->entityManager->persist(new ExchangeRate('GBP', 'EUR', 1.17, $now));
            $this->entityManager->flush();
        }

        $primaryUser = $targetUsers[0];

        // LLM Token Usages mock seeding
        $tokenUsageRepo = $this->entityManager->getRepository(UserLLMTokenUsage::class);
        if ($tokenUsageRepo->count([]) === 0) {
            $this->entityManager->persist(new UserLLMTokenUsage(
                $primaryUser,
                'gemini',
                'gemini-2.5-flash',
                12400,
                3200,
                15600,
                $now->modify('-2 hours')
            ));
            $this->entityManager->persist(new UserLLMTokenUsage(
                $primaryUser,
                'gemini',
                'gemini-2.5-flash',
                8500,
                1900,
                10400,
                $now->modify('-1 hour')
            ));
            $this->entityManager->persist(new UserLLMTokenUsage(
                $primaryUser,
                'mistral',
                'mistral-small-latest',
                18200,
                4600,
                22800,
                $now->modify('-30 minutes')
            ));
            $this->entityManager->flush();
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
            $item1->setUser($primaryUser);
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
            $item2->setUser($primaryUser);
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
            $item3->setUser($primaryUser);
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
            $item4->setUser($primaryUser);
            $item4->setPriority(0);
            $this->entityManager->persist($item4);
            $this->entityManager->flush();
        }

        return Command::SUCCESS;
    }
}
