<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\Vacancy;
use App\Message\ProcessJobUrlMessage;
use App\Service\Llm\LlmManager;
use App\Service\Mercure\MercurePublisherService;
use App\Service\Scraper\RemoteParserApiClient;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\Exception\RecoverableMessageHandlingException;
use Throwable;

#[AsMessageHandler]
class ProcessJobUrlHandler
{
    private const MAX_ATTEMPTS = 4;

    private EntityManagerInterface $entityManager;
    private RemoteParserApiClient $parserClient;
    private LlmManager $llmManager;
    private MercurePublisherService $mercure;
    private LoggerInterface $logger;

    public function __construct(
        EntityManagerInterface $entityManager,
        RemoteParserApiClient $parserClient,
        LlmManager $llmManager,
        MercurePublisherService $mercure,
        LoggerInterface $logger
    ) {
        $this->entityManager = $entityManager;
        $this->parserClient = $parserClient;
        $this->llmManager = $llmManager;
        $this->mercure = $mercure;
        $this->logger = $logger;
    }

    public function __invoke(ProcessJobUrlMessage $message): void
    {
        $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);
        /** @var ProcessingQueueItem|null $item */
        $item = $queueRepo->findOneBy(['taskId' => $message->getTaskId()]);

        $now = new \DateTimeImmutable();
        if ($item === null) {
            $item = new ProcessingQueueItem(
                $message->getTaskId(),
                $message->getUrl(),
                'processing',
                'scraping',
                $message->getAttempts(),
                $now
            );
            $this->entityManager->persist($item);
        } else {
            $item->setStatus('processing');
            $item->setStage('scraping');
            $item->setAttempts($message->getAttempts());
            $item->setUpdatedAt($now);
        }
        $this->entityManager->flush();

        try {
            // Stage 1: Scraping
            $scraped = $this->parserClient->parseJob($message->getUrl(), null);

            $item->setStage('ai');
            $item->setUpdatedAt(new \DateTimeImmutable());
            $this->entityManager->flush();

            // Stage 2: AI Summarization
            $provider = $this->llmManager->getDefaultProvider();
            $summaryResult = $provider->summarizeVacancy(
                $scraped['title'] ?? '',
                $scraped['company'] ?? '',
                $scraped['description'] ?? '',
                $scraped['location'] ?? '',
                'ru',
                []
            );

            // Stage 3: Create & Persist Vacancy
            $user = null;
            if ($message->getUserId() !== null) {
                $user = $this->entityManager->getRepository(User::class)->find($message->getUserId());
            }

            $vacancy = null;
            if ($item->getVacancyId() !== null) {
                /** @var Vacancy|null $vacancy */
                $vacancy = $this->entityManager->getRepository(Vacancy::class)->find($item->getVacancyId());
            }
            if ($vacancy === null) {
                $vacancy = new Vacancy();
                $vacancy->setUrl($message->getUrl());
                $vacancy->setUser($user);
                $this->entityManager->persist($vacancy);
            }

            $vacancy->setTitle($summaryResult['title'] ?? ($scraped['title'] ?? 'Untitled Vacancy'));
            $vacancy->setCompany($summaryResult['company'] ?? ($scraped['company'] ?? 'Unknown Company'));
            $vacancy->setStatus(Vacancy::STATUS_NOT_CONTACTED);
            $vacancy->setIsClosed(false);
            $vacancy->setLane(0);
            $vacancy->setTechStack($summaryResult['tech_stack'] ?? []);
            $vacancy->setTags([]);

            $vacancy->setLocation($summaryResult['location'] ?? ($scraped['location'] ?? null));
            $vacancy->setCity($summaryResult['city'] ?? null);
            $vacancy->setCountry($summaryResult['country'] ?? null);
            $vacancy->setDescription($scraped['description'] ?? null);
            $vacancy->setAiSummary($summaryResult['summary'] ?? null);
            $vacancy->setCompanyInfo($summaryResult['company_info'] ?? null);
            $vacancy->setSalaryMin($summaryResult['salary_min'] ?? null);
            $vacancy->setSalaryMax($summaryResult['salary_max'] ?? null);
            $vacancy->setSalaryCurrency($summaryResult['salary_currency'] ?? null);
            $vacancy->setSalaryPeriod($summaryResult['salary_period'] ?? null);
            $vacancy->setUpdatedAt(new \DateTimeImmutable());

            // Complete queue item
            $item->setStatus('completed');
            $item->setStage(null);
            $item->setVacancyId($vacancy->getId());
            $item->setUpdatedAt(new \DateTimeImmutable());
            $this->entityManager->flush();

        } catch (Throwable $e) {
            $this->logger->error(sprintf('Error processing task %s: %s', $message->getTaskId(), $e->getMessage()), [
                'exception' => $e,
            ]);

            $attempts = $message->getAttempts() + 1;
            $item->setAttempts($attempts);
            $item->setError($e->getMessage());
            $item->setUpdatedAt(new \DateTimeImmutable());

            if ($attempts < self::MAX_ATTEMPTS) {
                $item->setStatus('pending');
                $this->entityManager->flush();

                throw new RecoverableMessageHandlingException(
                    sprintf('Task %s failed (attempt %d/%d): %s', $message->getTaskId(), $attempts, self::MAX_ATTEMPTS, $e->getMessage()),
                    0,
                    $e
                );
            }

            $item->setStatus('failed');
            $item->setStage('failed');
            $this->entityManager->flush();

            $topic = $message->getUserId() !== null
                ? sprintf('vacancies:%d', $message->getUserId())
                : MercurePublisherService::DEFAULT_TOPIC;

            $this->mercure->publish(
                $topic,
                MercurePublisherService::EVENT_TASK_FAILED,
                MercurePublisherService::MSG_TASK_FAILED,
                [
                    'task_id' => $message->getTaskId(),
                    'url' => $message->getUrl(),
                    'error' => $e->getMessage(),
                ]
            );
        }
    }
}
