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
    private const COMPANIES = [
        'Stripe', 'Initech', 'Acme Corp', 'Globex Corporation', 'Stark Industries',
        'Wayne Enterprises', 'Hooli', 'Pied Piper', 'Cyberdyne Systems', 'Umbrella Corp',
        'Soylent Corp', 'Wonka Industries', 'Vandelay Industries', 'Dunder Mifflin',
        'Massive Dynamic', 'Aperture Science', 'Black Mesa', 'Tyrell Corporation'
    ];

    private const TITLES = [
        'Staff Backend Engineer — Payment Infrastructure',
        'Senior Backend Engineer (Python / FastAPI)',
        'Fullstack Developer (React / Next.js / TypeScript)',
        'DevOps / Platform Engineer (Kubernetes / AWS)',
        'Lead Python Developer (Distributed Systems)',
        'Senior Machine Learning Engineer (LLM / RAG)',
        'Junior QA Automation Engineer (Playwright / Pytest)',
        'Senior Frontend Architect — UI Platform',
        'Principal Data Engineer (Kafka / ClickHouse)',
        'Site Reliability Engineer (EKS / Observability)',
        'Senior Go Developer (High-Throughput Microservices)',
        'Mobile Application Developer (React Native / iOS)'
    ];

    private const LOCATIONS = [
        ['location' => 'Dublin, Ireland', 'city' => 'Dublin', 'country' => 'Ireland', 'workplaceType' => 'remote'],
        ['location' => 'Berlin, Germany', 'city' => 'Berlin', 'country' => 'Germany', 'workplaceType' => 'remote'],
        ['location' => 'Amsterdam, Netherlands', 'city' => 'Amsterdam', 'country' => 'Netherlands', 'workplaceType' => 'hybrid'],
        ['location' => 'London, UK', 'city' => 'London', 'country' => 'United Kingdom', 'workplaceType' => 'hybrid'],
        ['location' => 'New York, USA', 'city' => 'New York', 'country' => 'United States', 'workplaceType' => 'on-site'],
        ['location' => 'Austin, USA', 'city' => 'Austin', 'country' => 'United States', 'workplaceType' => 'remote'],
        ['location' => 'Warsaw, Poland', 'city' => 'Warsaw', 'country' => 'Poland', 'workplaceType' => 'remote'],
        ['location' => 'Lisbon, Portugal', 'city' => 'Lisbon', 'country' => 'Portugal', 'workplaceType' => 'remote'],
        ['location' => 'Barcelona, Spain', 'city' => 'Barcelona', 'country' => 'Spain', 'workplaceType' => 'hybrid'],
        ['location' => 'Remote, Global', 'city' => null, 'country' => null, 'workplaceType' => 'remote'],
    ];

    private const STACKS = [
        ['Go', 'PostgreSQL', 'Kafka', 'Kubernetes'],
        ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
        ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
        ['Kubernetes', 'Terraform', 'Docker', 'AWS'],
        ['Python', 'PostgreSQL', 'Redis', 'Kafka'],
        ['PyTorch', 'Python', 'vLLM', 'HuggingFace'],
        ['Python', 'Pytest', 'Playwright', 'Docker'],
        ['TypeScript', 'React 19', 'Storybook', 'Radix UI'],
        ['Go', 'gRPC', 'PostgreSQL', 'AWS'],
        ['Node.js', 'TypeScript', 'GraphQL', 'Redis'],
    ];

    private const STATUSES = [
        Vacancy::STATUS_NOT_CONTACTED,
        Vacancy::STATUS_CONTACTED,
        Vacancy::STATUS_INTERVIEW,
        Vacancy::STATUS_ASSESSMENT,
        Vacancy::STATUS_OFFER,
        Vacancy::STATUS_REJECTED,
    ];

    private const SOURCES = ['LinkedIn', 'Habr Career', 'Upwork', 'hh.ru', 'Wellfound', 'Indeed'];
    private const TAGS = ['priority', 'backend', 'fullstack', 'remote-friendly', 'devops', 'infra', 'ai', 'lead', 'startup'];

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
            ->addOption('count', 'c', InputOption::VALUE_REQUIRED, 'Number of mock vacancies to generate per user', '50')
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Seed mock vacancies even if user already has vacancies');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $now = new \DateTimeImmutable();

        $emailOpt = $input->getOption('email');
        $force = (bool)$input->getOption('force');
        $targetCount = max(1, (int)$input->getOption('count'));

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

        $curatedMocks = [
            [
                'url' => 'https://www.linkedin.com/jobs/view/stripe-staff-001',
                'title' => 'Staff Backend Engineer — Payment Infrastructure',
                'company' => 'Stripe',
                'companyInfo' => 'Stripe is a financial infrastructure platform for businesses.',
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
                'description' => "We are looking for a Staff Backend Engineer to architect and scale Stripe's core payment settlement and distributed ledger systems.\n\nResponsibilities:\n- Design and operate mission-critical distributed services processing millions of transactions per minute with 99.999% availability.\n- Lead technical architecture across Go, PostgreSQL, and Kafka event-driven pipelines.\n- Collaborate with product, risk, and treasury teams to deliver low-latency global settlement capabilities.\n\nRequirements:\n- 7+ years of production backend engineering experience in Go, Java, C++, or Ruby.\n- Deep expertise in relational databases (PostgreSQL), distributed transactions, idempotency, and event streaming (Kafka).\n- Proven track record of running high-throughput microservices on Kubernetes and AWS.",
                'techStack' => ['Go', 'PostgreSQL', 'Kafka', 'Kubernetes'],
                'status' => Vacancy::STATUS_NOT_CONTACTED,
                'tags' => ['fintech', 'priority'],
                'lane' => 0,
                'sortOrder' => 0.0,
            ],
            [
                'url' => 'https://example.com/jobs/1',
                'title' => 'Senior Backend Engineer',
                'company' => 'Initech',
                'companyInfo' => 'Enterprise SaaS platform for B2B workflow automation.',
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
                'description' => "Initech is hiring a Senior Backend Engineer to build scalable APIs and background processing pipelines.\n\nResponsibilities:\n- Develop and maintain RESTful and asynchronous services using Python (FastAPI) and PostgreSQL.\n- Optimize SQL queries, indexing strategies, and Redis caching layers.\n- Containerize applications with Docker and maintain automated CI/CD workflows.\n\nRequirements:\n- 4+ years of backend development experience with Python (FastAPI, Django, or asyncio).\n- Strong knowledge of PostgreSQL, relational schema design, and query optimization.\n- Experience with Docker, Redis, and automated testing with Pytest.",
                'techStack' => ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
                'status' => Vacancy::STATUS_NOT_CONTACTED,
                'tags' => ['priority', 'backend'],
                'lane' => 0,
                'sortOrder' => 1.0,
            ],
            [
                'url' => 'https://example.com/jobs/2',
                'title' => 'Fullstack Developer',
                'company' => 'Acme Corp',
                'companyInfo' => 'Cloud-native e-commerce and analytics platform.',
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
                'description' => "Acme Corp is looking for a Fullstack Developer to build customer-facing dashboards and backend APIs.\n\nResponsibilities:\n- Build responsive web interfaces using React, TypeScript, and Next.js.\n- Implement backend endpoints and data integrations using Python and FastAPI.\n- Write unit and end-to-end tests and participate in code reviews.\n\nRequirements:\n- 3+ years of fullstack experience with React, TypeScript, and modern CSS.\n- Solid backend experience with Python (FastAPI) or Node.js and PostgreSQL.\n- Familiarity with Git, Docker, and agile product delivery.",
                'techStack' => ['React', 'TypeScript', 'Python', 'FastAPI'],
                'status' => Vacancy::STATUS_CONTACTED,
                'tags' => ['fullstack'],
                'lane' => 0,
                'sortOrder' => 2.0,
            ],
            [
                'url' => 'https://example.com/jobs/3',
                'title' => 'DevOps / Platform Engineer',
                'company' => 'Globex Corporation',
                'companyInfo' => 'Global cloud infrastructure and developer platform provider.',
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
                'description' => "Globex Corporation seeks a DevOps / Platform Engineer to scale our multi-region Kubernetes infrastructure.\n\nResponsibilities:\n- Manage AWS infrastructure as code using Terraform and Helm.\n- Operate production Kubernetes (EKS) clusters, observability stacks (Prometheus, Grafana), and GitOps pipelines.\n- Improve deployment reliability, security hardening, and developer experience.\n\nRequirements:\n- 4+ years in DevOps, SRE, or Platform Engineering roles.\n- Strong hands-on experience with Kubernetes, Docker, Terraform, and AWS.\n- Proficiency in Linux systems administration, Bash/Python scripting, and CI/CD automation.",
                'techStack' => ['Kubernetes', 'Terraform', 'Docker', 'AWS'],
                'status' => Vacancy::STATUS_INTERVIEW,
                'tags' => ['devops', 'infra'],
                'lane' => 1,
                'sortOrder' => 3.0,
            ],
            [
                'url' => 'https://example.com/jobs/4',
                'title' => 'Lead Python Developer',
                'company' => 'Stark Industries',
                'companyInfo' => 'Advanced defense, clean energy, and high-performance computing R&D.',
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
                'description' => "Stark Industries is hiring a Lead Python Developer to lead our real-time telemetry and distributed data platform.\n\nResponsibilities:\n- Architect low-latency data ingestion services using Python, Kafka, and Redis.\n- Mentor a team of 6 engineers, establish architectural standards, and drive technical roadmaps.\n- Design horizontally scalable PostgreSQL storage and partitioning strategies.\n\nRequirements:\n- 6+ years of software engineering experience with deep expertise in Python.\n- Proven experience designing high-load distributed systems with Kafka, Redis, and PostgreSQL.\n- Prior technical leadership or staff/lead engineering experience.",
                'techStack' => ['Python', 'PostgreSQL', 'Redis', 'Kafka'],
                'status' => Vacancy::STATUS_ASSESSMENT,
                'tags' => ['lead', 'architecture'],
                'lane' => 0,
                'sortOrder' => 4.0,
            ],
            [
                'url' => 'https://example.com/jobs/5',
                'title' => 'Senior Machine Learning Engineer',
                'company' => 'Wayne Enterprises',
                'companyInfo' => 'Applied AI research and enterprise intelligence systems.',
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
                'description' => "Wayne Enterprises is seeking a Senior Machine Learning Engineer to build production LLM agents and retrieval-augmented generation (RAG) pipelines.\n\nResponsibilities:\n- Design, evaluate, and deploy fine-tuned LLMs and embedding pipelines using PyTorch, vLLM, and HuggingFace.\n- Build low-latency inference services and automated evaluation benchmarks.\n- Partner with product engineering teams to integrate AI capabilities into core workflows.\n\nRequirements:\n- 5+ years in ML engineering or data science with strong Python and PyTorch skills.\n- Hands-on experience with LLMs, RAG architectures, vector databases, and vLLM/HuggingFace.\n- Experience deploying ML models to production on GPU Kubernetes clusters.",
                'techStack' => ['PyTorch', 'Python', 'vLLM', 'HuggingFace'],
                'status' => Vacancy::STATUS_OFFER,
                'tags' => ['ai', 'ml'],
                'lane' => 0,
                'sortOrder' => 5.0,
            ],
            [
                'url' => 'https://example.com/jobs/6',
                'title' => 'Junior QA Engineer',
                'company' => 'Hooli',
                'companyInfo' => 'Consumer cloud services and software ecosystem.',
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
                'description' => "Hooli is looking for a Junior QA Engineer to join our quality assurance team in Berlin.\n\nResponsibilities:\n- Write and maintain automated UI and API tests using Python, Pytest, and Selenium.\n- Execute regression testing, report defects, and verify bug fixes alongside developers.\n\nRequirements:\n- 1+ year of experience in QA automation or manual/automated testing.\n- Basic proficiency in Python, Pytest, Selenium/Playwright, and REST API testing.\n- Attention to detail and strong communication skills.",
                'techStack' => ['Python', 'Pytest', 'Selenium'],
                'status' => Vacancy::STATUS_REJECTED,
                'tags' => [],
                'lane' => 0,
                'sortOrder' => 6.0,
            ],
        ];

        $vacancyRepo = $this->entityManager->getRepository(Vacancy::class);

        foreach ($targetUsers as $user) {
            $userVacancyCount = $vacancyRepo->count(['user' => $user]);
            if ($userVacancyCount === 0 || $force) {
                // Build vacancy list up to targetCount
                $generatedMocks = [];
                foreach ($curatedMocks as $cm) {
                    $generatedMocks[] = $cm;
                }

                $currencies = ['EUR', 'USD', 'GBP'];
                $currencySymbols = ['EUR' => '€', 'USD' => '$', 'GBP' => '£'];

                for ($i = count($generatedMocks); $i < $targetCount; $i++) {
                    $locItem = self::LOCATIONS[$i % count(self::LOCATIONS)];
                    $title = self::TITLES[$i % count(self::TITLES)];
                    $company = self::COMPANIES[$i % count(self::COMPANIES)];
                    $stack = self::STACKS[$i % count(self::STACKS)];
                    $status = self::STATUSES[$i % count(self::STATUSES)];
                    $source = self::SOURCES[$i % count(self::SOURCES)];
                    $currency = $currencies[$i % count($currencies)];
                    $baseSalary = (float)(3500 + ($i % 10) * 1000);
                    $salaryMax = $baseSalary + 2500.0;
                    $hex = substr(md5($user->getEmail() . '-' . $i . '-' . uniqid('', true)), 0, 12);

                    $generatedMocks[] = [
                        'url' => sprintf('https://example.com/mock/jobs/%s', $hex),
                        'title' => $title,
                        'company' => $company,
                        'companyInfo' => sprintf('%s develops high-grade software solutions for global customers.', $company),
                        'jobId' => sprintf('job-mock-%s', $hex),
                        'source' => $source,
                        'location' => $locItem['location'],
                        'city' => $locItem['city'],
                        'country' => $locItem['country'],
                        'workplaceType' => $locItem['workplaceType'],
                        'isClosed' => ($status === Vacancy::STATUS_REJECTED && ($i % 3 === 0)),
                        'salaryMin' => $baseSalary,
                        'salaryMax' => $salaryMax,
                        'salaryCurrency' => $currency,
                        'salaryPeriod' => 'month',
                        'aiSummary' => sprintf('%s at %s. Stack: %s.', $title, $company, implode(', ', $stack)),
                        'description' => sprintf(
                            "%s is looking for a qualified %s.\n\nResponsibilities:\n- Build and maintain mission-critical components.\n- Collaborate in a distributed engineering team.\n- Drive automated testing, code quality, and documentation.\n\nRequirements:\n- Strong production proficiency in %s.\n- Familiarity with modern agile software engineering best practices.\n- Good English communication skills.",
                            $company,
                            $title,
                            implode(', ', $stack)
                        ),
                        'techStack' => $stack,
                        'status' => $status,
                        'tags' => array_values(array_slice(self::TAGS, ($i * 2) % count(self::TAGS), 2)),
                        'lane' => in_array($status, [Vacancy::STATUS_INTERVIEW, Vacancy::STATUS_ASSESSMENT], true) ? ($i % 3) : 0,
                        'sortOrder' => (float)$i,
                    ];
                }

                $orderIdx = 0;
                foreach ($generatedMocks as $mv) {
                    /** @var Vacancy|null $existing */
                    $existing = $vacancyRepo->findOneBy(['user' => $user, 'url' => $mv['url']]);
                    if ($existing !== null) {
                        if ($existing->getDescription() === null || trim((string)$existing->getDescription()) === '') {
                            $existing->setDescription($mv['description']);
                        }
                        if ($existing->getCompanyInfo() === null || trim((string)$existing->getCompanyInfo()) === '') {
                            $existing->setCompanyInfo($mv['companyInfo']);
                        }
                        continue;
                    }
                    $v = new Vacancy();
                    $v->setUrl($mv['url']);
                    $v->setTitle($mv['title']);
                    $v->setCompany($mv['company']);
                    $v->setCompanyInfo($mv['companyInfo']);
                    $v->setStatus($mv['status']);
                    $v->setIsClosed($mv['isClosed']);
                    $v->setLane($mv['lane']);
                    $v->setTechStack($mv['techStack']);
                    $v->setTags($mv['tags']);
                    $v->setCreatedAt($now->modify(sprintf('-%d hours', $orderIdx * 3)));
                    $v->setUpdatedAt($now->modify(sprintf('-%d hours', $orderIdx * 3)));
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
                    $v->setDescription($mv['description']);
                    $v->setSortOrder((float)$orderIdx);

                    $this->entityManager->persist($v);

                    // Insert status history: always record initial creation as STATUS_NOT_CONTACTED
                    $hInit = new VacancyStatusHistory($v, null, Vacancy::STATUS_NOT_CONTACTED, null, 0, null, $v->getCreatedAt());
                    $this->entityManager->persist($hInit);

                    // If final status is different, record transition to current status
                    if ($mv['status'] !== Vacancy::STATUS_NOT_CONTACTED) {
                        $hTransition = new VacancyStatusHistory(
                            $v,
                            Vacancy::STATUS_NOT_CONTACTED,
                            $mv['status'],
                            0,
                            $mv['lane'],
                            null,
                            $now->modify(sprintf('-%d minutes', $orderIdx * 10))
                        );
                        $this->entityManager->persist($hTransition);
                    }

                    $orderIdx++;
                }
                $this->entityManager->flush();
                $io->success(sprintf('Seeded %d mock vacancies for %s.', count($generatedMocks), $user->getEmail()));
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

        // Synchronize all PostgreSQL sequences across the database
        $this->syncAllSequences();

        return Command::SUCCESS;
    }

    private function syncAllSequences(): void
    {
        try {
            $conn = $this->entityManager->getConnection();
            $conn->executeStatement("DO \$\$
            DECLARE
                seq RECORD;
            BEGIN
                FOR seq IN 
                    SELECT s.relname AS seq_name, t.relname AS table_name, a.attname AS column_name
                    FROM pg_class s
                    JOIN pg_depend d ON d.objid = s.oid AND d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
                    JOIN pg_class t ON t.oid = d.refobjid
                    JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
                    WHERE s.relkind = 'S'
                LOOP
                    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1))', seq.seq_name, seq.column_name, seq.table_name);
                END LOOP;
            END \$\$;");
        } catch (\Throwable) {
            // Ignore in non-Postgres environments (e.g., SQLite tests)
        }
    }
}
