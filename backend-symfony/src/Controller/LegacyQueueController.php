<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

use App\Service\Mercure\MercurePublisherService;

class LegacyQueueController extends AbstractController
{
    #[Route('/api/queue/status', name: 'api_queue_status_legacy', methods: ['GET'])]
    public function queueStatus(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $criteria = $user !== null ? ['user' => $user] : [];

        $total = $repo->count($criteria);
        $pending = $repo->count(array_merge($criteria, ['status' => 'pending']));
        $processing = $repo->count(array_merge($criteria, ['status' => 'processing']));
        $completed = $repo->count(array_merge($criteria, ['status' => 'completed']));
        $failed = $repo->count(array_merge($criteria, ['status' => 'failed']));

        return new JsonResponse([
            'pending' => $pending,
            'processing' => $processing,
            'total_remaining' => $pending + $processing,
            'completed' => $completed,
            'failed' => $failed,
            'pending_scrape' => 0,
            'pending_ai' => 0,
            'processing_scrape' => 0,
            'processing_ai' => 0,
            'recent_tasks' => [],
        ]);
    }

    #[Route('/api/queue/tasks', name: 'api_queue_tasks_legacy', methods: ['GET'])]
    public function queueTasks(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $criteria = $user !== null ? ['user' => $user] : [];

        $items = $repo->findBy($criteria, ['createdAt' => 'DESC'], 50);
        $result = [];
        foreach ($items as $item) {
            $result[] = [
                'task_id' => $item->getTaskId(),
                'url' => $item->getUrl(),
                'status' => $item->getStatus(),
                'stage' => $item->getStage(),
                'attempts' => $item->getAttempts(),
                'error' => $item->getError(),
                'vacancy_id' => $item->getVacancyId(),
                'created_at' => $item->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return new JsonResponse($result);
    }

    #[Route('/api/queue/links', name: 'api_queue_links_legacy', methods: ['GET'])]
    #[Route('/api/v1/queue/links', name: 'api_v1_queue_links', methods: ['GET'])]
    #[Route('/api/v2/queue/links', name: 'api_v2_queue_links', methods: ['GET'])]
    public function queueLinks(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $criteria = $user !== null ? ['user' => $user] : [];

        $items = $repo->findBy($criteria, ['createdAt' => 'DESC'], 100);
        $links = [];
        $pendingCount = 0;
        $processingCount = 0;
        $failedCount = 0;

        foreach ($items as $item) {
            $st = $item->getStatus();
            if ($st === 'pending') {
                $pendingCount++;
            } elseif ($st === 'processing') {
                $processingCount++;
            } elseif ($st === 'failed') {
                $failedCount++;
            }

            $links[] = [
                'task_id' => $item->getTaskId(),
                'url' => $item->getUrl(),
                'status' => $item->getStatus(),
                'attempts' => $item->getAttempts(),
                'error' => $item->getError(),
                'created_at' => $item->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return new JsonResponse([
            'links' => $links,
            'total' => count($links),
            'pending_count' => $pendingCount,
            'processing_count' => $processingCount,
            'failed_count' => $failedCount,
        ]);
    }

    #[Route('/api/queue/clear', name: 'api_queue_clear_legacy', methods: ['DELETE'])]
    #[Route('/api/v2/queue/clear', name: 'api_v2_queue_clear', methods: ['DELETE'])]
    #[Route('/api/queue/links', name: 'api_queue_links_clear_legacy', methods: ['DELETE'])]
    #[Route('/api/v1/queue/links', name: 'api_v1_queue_links_clear', methods: ['DELETE'])]
    #[Route('/api/v2/queue/links', name: 'api_v2_queue_links_clear', methods: ['DELETE'])]
    public function clearQueue(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $criteria = $user !== null ? ['user' => $user] : [];

        $items = $repo->findBy($criteria);
        foreach ($items as $item) {
            $entityManager->remove($item);
        }
        $entityManager->flush();

        return new JsonResponse(['status' => 'cleared']);
    }

    #[Route('/api/queue/links/{taskId}', name: 'api_queue_link_get_legacy', methods: ['GET'])]
    #[Route('/api/v1/queue/links/{taskId}', name: 'api_v1_queue_link_get', methods: ['GET'])]
    public function getQueueLink(
        string $taskId,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        $criteria = ['taskId' => $taskId];
        if ($user !== null) {
            $criteria['user'] = $user;
        }

        /** @var ProcessingQueueItem|null $item */
        $item = $entityManager->getRepository(ProcessingQueueItem::class)->findOneBy($criteria);
        if ($item === null) {
            return new JsonResponse(['detail' => 'Queue link task not found or access denied'], Response::HTTP_404);
        }

        return new JsonResponse([
            'task_id' => $item->getTaskId(),
            'url' => $item->getUrl(),
            'status' => $item->getStatus(),
            'attempts' => $item->getAttempts(),
            'error' => $item->getError(),
            'created_at' => $item->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/api/queue/links/{taskId}', name: 'api_queue_link_cancel_legacy', methods: ['DELETE'])]
    #[Route('/api/v1/queue/links/{taskId}', name: 'api_v1_queue_link_cancel', methods: ['DELETE'])]
    #[Route('/api/v2/queue/links/{taskId}', name: 'api_v2_queue_link_cancel', methods: ['DELETE'])]
    public function cancelQueueLink(
        string $taskId,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        $criteria = ['taskId' => $taskId];
        if ($user !== null) {
            $criteria['user'] = $user;
        }

        /** @var ProcessingQueueItem|null $item */
        $item = $entityManager->getRepository(ProcessingQueueItem::class)->findOneBy($criteria);
        if ($item === null) {
            return new JsonResponse(['detail' => 'Task not found or cannot be cancelled'], Response::HTTP_404);
        }

        $entityManager->remove($item);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Link processing cancelled']);
    }

    #[Route('/api/v2/queue/sync', name: 'api_v2_queue_sync', methods: ['POST'])]
    public function syncQueueState(
        MercurePublisherService $mercure,
        #[CurrentUser] ?User $user
    ): Response {
        if ($user !== null) {
            $mercure->publish(
                'vacancies:' . $user->getId(),
                MercurePublisherService::EVENT_QUEUE_STATE,
                'QUEUE_STATE',
                ['items' => []]
            );
        }

        return new Response(null, Response::HTTP_ACCEPTED);
    }
}
