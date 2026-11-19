<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ApprovedCV;
use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\Vacancy;
use App\Entity\VacancyCVAnalysis;
use App\Message\ScoreVacancyMessage;
use App\Service\Llm\LlmManager;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Uid\Uuid;

class VacancyScoringService
{
    private EntityManagerInterface $entityManager;
    private LlmManager $llmManager;
    private MercurePublisherService $mercure;
    private MessageBusInterface $messageBus;
    private SerializerInterface $serializer;
    private LoggerInterface $logger;

    public function __construct(
        EntityManagerInterface $entityManager,
        LlmManager $llmManager,
        MercurePublisherService $mercure,
        MessageBusInterface $messageBus,
        SerializerInterface $serializer,
        LoggerInterface $logger
    ) {
        $this->entityManager = $entityManager;
        $this->llmManager = $llmManager;
        $this->mercure = $mercure;
        $this->messageBus = $messageBus;
        $this->serializer = $serializer;
        $this->logger = $logger;
    }

    public function triggerScoringForUserVacancies(User $user): int
    {
        $analysisRepo = $this->entityManager->getRepository(VacancyCVAnalysis::class);
        $analysisRepo->createQueryBuilder('a')
            ->update()
            ->set('a.isOutdated', ':true')
            ->where('a.user = :user')
            ->setParameter('true', true)
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        $vacancyRepo = $this->entityManager->getRepository(Vacancy::class);
        $vacancies = $vacancyRepo->findBy([
            'user' => $user,
            'status' => Vacancy::STATUS_NOT_CONTACTED,
        ]);

        $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);
        $pendingItems = $queueRepo->findBy([
            'user' => $user,
            'stage' => 'cv_scoring',
            'status' => 'pending',
        ]);
        $pendingVacIds = [];
        foreach ($pendingItems as $pi) {
            $pvId = $pi->getVacancyId();
            if ($pvId !== null) {
                $pendingVacIds[$pvId] = true;
            }
        }

        $now = new \DateTimeImmutable();
        $queuedCount = 0;

        foreach ($vacancies as $vacancy) {
            $desc = $vacancy->getDescription();
            if ($desc === null || trim($desc) === '') {
                continue;
            }

            $vId = $vacancy->getId();
            if ($vId !== null && isset($pendingVacIds[$vId])) {
                continue;
            }

            $taskId = Uuid::v4()->toRfc4122();
            $item = new ProcessingQueueItem(
                $taskId,
                $vacancy->getUrl() ?? ('vacancy://' . $vacancy->getId()),
                'pending',
                'cv_scoring',
                0,
                $now
            );
            $item->setUser($user);
            $item->setVacancyId($vacancy->getId());
            $this->entityManager->persist($item);

            $this->messageBus->dispatch(new ScoreVacancyMessage((int)$vacancy->getId(), (int)$user->getId(), true));
            $queuedCount++;
        }

        $this->entityManager->flush();

        $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);
        $totalRemaining = (int)$queueRepo->count([
            'user' => $user,
            'status' => ['pending', 'processing'],
        ]);

        $this->mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_QUEUE_UPDATED,
            MercurePublisherService::MSG_QUEUE_UPDATED,
            [
                'total_remaining' => $totalRemaining,
                'queued_count' => $queuedCount,
            ]
        );

        $this->logger->info(sprintf('Enqueued %d vacancies for scoring for user %d', $queuedCount, $user->getId()));

        return $queuedCount;
    }

    public function triggerScoringForVacancy(Vacancy $vacancy, User $user): void
    {
        $analysisRepo = $this->entityManager->getRepository(VacancyCVAnalysis::class);
        $analysisRepo->createQueryBuilder('a')
            ->update()
            ->set('a.isOutdated', ':true')
            ->where('a.vacancy = :vacancy AND a.user = :user')
            ->setParameter('true', true)
            ->setParameter('vacancy', $vacancy)
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        $cvRepo = $this->entityManager->getRepository(ApprovedCV::class);
        $cv = $cvRepo->findOneBy(['user' => $user]);
        if ($cv === null || trim((string)$cv->getContent()) === '') {
            return;
        }

        $desc = $vacancy->getDescription();
        if ($desc === null || trim($desc) === '') {
            return;
        }

        $now = new \DateTimeImmutable();
        $taskId = Uuid::v4()->toRfc4122();
        $item = new ProcessingQueueItem(
            $taskId,
            $vacancy->getUrl() ?? ('vacancy://' . $vacancy->getId()),
            'pending',
            'cv_scoring',
            0,
            $now
        );
        $item->setUser($user);
        $item->setVacancyId($vacancy->getId());
        $this->entityManager->persist($item);
        $this->entityManager->flush();

        $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);
        $totalRemaining = (int)$queueRepo->count([
            'user' => $user,
            'status' => ['pending', 'processing'],
        ]);

        $this->mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_QUEUE_UPDATED,
            MercurePublisherService::MSG_QUEUE_UPDATED,
            [
                'total_remaining' => $totalRemaining,
                'queued_count' => 1,
                'vacancy_id' => $vacancy->getId(),
            ]
        );

        $this->messageBus->dispatch(new ScoreVacancyMessage((int)$vacancy->getId(), (int)$user->getId(), true));
    }

    public function handleScoreMessage(int $vacancyId, int $userId, bool $force): void
    {
        $vacancyRepo = $this->entityManager->getRepository(Vacancy::class);
        $userRepo = $this->entityManager->getRepository(User::class);
        $cvRepo = $this->entityManager->getRepository(ApprovedCV::class);
        $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);

        $vacancy = $vacancyRepo->find($vacancyId);
        $user = $userRepo->find($userId);

        if ($vacancy === null || $user === null) {
            return;
        }

        $cv = $cvRepo->findOneBy(['user' => $user]);
        if ($cv === null || trim((string)$cv->getContent()) === '') {
            $this->completeQueueItemsForVacancy($vacancyId, $user);
            return;
        }

        $description = $vacancy->getDescription();
        if ($description === null || trim($description) === '') {
            $this->completeQueueItemsForVacancy($vacancyId, $user);
            return;
        }

        try {
            $this->executeScoring($vacancy, $cv, $user);
            $this->completeQueueItemsForVacancy($vacancyId, $user);
        } catch (\Throwable $e) {
            $this->logger->error(sprintf('Error scoring vacancy %d: %s', $vacancyId, $e->getMessage()), [
                'exception' => $e,
            ]);
            $this->failQueueItemsForVacancy($vacancyId, $user, $e->getMessage());
        }

        $totalRemaining = (int)$queueRepo->count([
            'user' => $user,
            'status' => ['pending', 'processing'],
        ]);

        $this->mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_QUEUE_UPDATED,
            MercurePublisherService::MSG_QUEUE_UPDATED,
            [
                'total_remaining' => $totalRemaining,
                'vacancy_id' => $vacancyId,
            ]
        );
    }

    public function executeScoring(Vacancy $vacancy, ApprovedCV $cv, User $user): VacancyCVAnalysis
    {
        $provider = $this->llmManager->getDefaultProvider();
        $compatResult = $provider->evaluateCompatibility(
            $vacancy->getDescription() ?? $vacancy->getTitle(),
            $cv->getContent(),
            'ru',
            []
        );

        $overallScore = (float)($compatResult['overallScore'] ?? 80.0);
        $now = new \DateTimeImmutable();

        $analysisRepo = $this->entityManager->getRepository(VacancyCVAnalysis::class);
        /** @var VacancyCVAnalysis|null $analysis */
        $analysis = $analysisRepo->findOneBy(['vacancy' => $vacancy, 'user' => $user]);

        if ($analysis !== null) {
            $analysis->setCvRevision($cv->getRevision());
            $analysis->setModelId($provider->getName());
            $analysis->setOverallScore($overallScore);
            $analysis->setResult($compatResult);
            $analysis->setIsOutdated(false);
            $analysis->setUpdatedAt($now);
        } else {
            $analysis = new VacancyCVAnalysis(
                $user,
                $vacancy,
                $cv->getRevision(),
                'v1.0',
                $provider->getName(),
                $overallScore,
                $compatResult,
                null,
                $now
            );
            $analysis->setIsOutdated(false);
            $analysis->setUpdatedAt($now);
            $this->entityManager->persist($analysis);
        }

        $vacancy->setMatchScore($overallScore);
        $vacancy->setUpdatedAt($now);
        $this->entityManager->flush();

        $payload = json_decode($this->serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read']]), true);
        $this->mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_VACANCY_UPDATED,
            MercurePublisherService::MSG_VACANCY_UPDATED,
            [
                'vacancy' => $payload,
                'vacancy_id' => $vacancy->getId(),
                'title' => $vacancy->getTitle(),
                'company' => $vacancy->getCompany(),
                'data' => $payload,
            ]
        );

        return $analysis;
    }

    private function completeQueueItemsForVacancy(int $vacancyId, User $user): void
    {
        $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);
        $items = $queueRepo->findBy([
            'vacancyId' => $vacancyId,
            'user' => $user,
            'status' => ['pending', 'processing'],
        ]);

        $now = new \DateTimeImmutable();
        foreach ($items as $item) {
            $item->setStatus('completed');
            $item->setStage('completed');
            $item->setUpdatedAt($now);
        }
        $this->entityManager->flush();
    }

    private function failQueueItemsForVacancy(int $vacancyId, User $user, string $error): void
    {
        $queueRepo = $this->entityManager->getRepository(ProcessingQueueItem::class);
        $items = $queueRepo->findBy([
            'vacancyId' => $vacancyId,
            'user' => $user,
            'status' => ['pending', 'processing'],
        ]);

        $now = new \DateTimeImmutable();
        foreach ($items as $item) {
            $item->setStatus('failed');
            $item->setStage('failed');
            $item->setError($error);
            $item->setUpdatedAt($now);
        }
        $this->entityManager->flush();
    }
}
