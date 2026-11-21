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
use Symfony\Component\HttpFoundation\Request;

class LegacyQueueController extends AbstractController
{
    private function checkApiAccess(User $user): ?JsonResponse
    {
        if ($user->isAdmin()) {
            return null;
        }

        foreach ($user->getFeatureFlags() as $flag) {
            if ($flag->getFlag() === 'api_access') {
                return null;
            }
        }

        return new JsonResponse([
            'detail' => 'API access is disabled for this user (missing feature flag api_access)',
        ], Response::HTTP_FORBIDDEN);
    }

    #[Route('/api/queue/status', name: 'api_queue_status_legacy', methods: ['GET'])]
    public function queueStatus(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $criteria = ['user' => $user];

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
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $criteria = ['user' => $user];

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
    public function queueLinks(
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        if (str_starts_with($request->getPathInfo(), '/api/v1/')) {
            $accessCheck = $this->checkApiAccess($user);
            if ($accessCheck !== null) {
                return $accessCheck;
            }
        }

        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $criteria = [
            'user' => $user,
            'status' => ['pending', 'processing', 'failed'],
        ];

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
                'normalized_url' => $item->getUrl(),
                'status' => $item->getStatus(),
                'stage' => $item->getStage() ?? 'queued',
                'attempts' => $item->getAttempts(),
                'max_attempts' => 4,
                'error' => $item->getError(),
                'vacancy_id' => $item->getVacancyId(),
                'created_at' => $item->getCreatedAt()->format('Y-m-d\TH:i:s'),
                'updated_at' => ($item->getUpdatedAt() ?? $item->getCreatedAt())->format('Y-m-d\TH:i:s'),
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
    public function clearQueue(
        Request $request,
        EntityManagerInterface $entityManager,
        MercurePublisherService $mercure,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        if (str_starts_with($request->getPathInfo(), '/api/v1/')) {
            $accessCheck = $this->checkApiAccess($user);
            if ($accessCheck !== null) {
                return $accessCheck;
            }
        }

        $repo = $entityManager->getRepository(ProcessingQueueItem::class);
        $items = $repo->findBy(['user' => $user]);
        foreach ($items as $item) {
            $entityManager->remove($item);
        }
        $entityManager->flush();

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_QUEUE_UPDATED,
            MercurePublisherService::MSG_QUEUE_UPDATED,
            [
                'total_remaining' => 0,
                'queued_count' => 0,
            ]
        );

        return new JsonResponse([
            'message' => 'All queue links cleared',
            'cleared' => count($items),
        ]);
    }

    #[Route('/api/queue/links/{taskId}', name: 'api_queue_link_get_legacy', methods: ['GET'])]
    #[Route('/api/v1/queue/links/{taskId}', name: 'api_v1_queue_link_get', methods: ['GET'])]
    public function getQueueLink(
        string $taskId,
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        if (str_starts_with($request->getPathInfo(), '/api/v1/')) {
            $accessCheck = $this->checkApiAccess($user);
            if ($accessCheck !== null) {
                return $accessCheck;
            }
        }

        /** @var ProcessingQueueItem|null $item */
        $item = $entityManager->getRepository(ProcessingQueueItem::class)->findOneBy([
            'taskId' => $taskId,
            'user' => $user,
        ]);
        if ($item === null) {
            return new JsonResponse(['detail' => 'Queue link task not found or access denied'], Response::HTTP_NOT_FOUND);
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
        Request $request,
        EntityManagerInterface $entityManager,
        MercurePublisherService $mercure,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        if (str_starts_with($request->getPathInfo(), '/api/v1/')) {
            $accessCheck = $this->checkApiAccess($user);
            if ($accessCheck !== null) {
                return $accessCheck;
            }
        }

        /** @var ProcessingQueueItem|null $item */
        $item = $entityManager->getRepository(ProcessingQueueItem::class)->findOneBy([
            'taskId' => $taskId,
            'user' => $user,
        ]);
        if ($item === null) {
            return new JsonResponse(['detail' => 'Task not found or cannot be cancelled'], Response::HTTP_NOT_FOUND);
        }

        $entityManager->remove($item);
        $entityManager->flush();

        $totalRemaining = (int)$entityManager->getRepository(ProcessingQueueItem::class)->count([
            'user' => $user,
            'status' => ['pending', 'processing'],
        ]);

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_QUEUE_UPDATED,
            MercurePublisherService::MSG_QUEUE_UPDATED,
            [
                'total_remaining' => $totalRemaining,
                'queued_count' => $totalRemaining,
                'task_id' => $taskId,
            ]
        );

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
