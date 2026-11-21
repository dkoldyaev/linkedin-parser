<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Message\ProcessJobUrlMessage;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

class ExtensionController extends AbstractController
{
    #[Route('/api/extension/ping', name: 'api_extension_ping_legacy', methods: ['POST'])]
    #[Route('/api/v2/extension/ping', name: 'api_extension_ping', methods: ['POST'])]
    public function ping(Request $request, #[CurrentUser] ?User $user, CacheItemPoolInterface $cache): JsonResponse
    {
        if ($user !== null) {
            $item = $cache->getItem('extension_active_' . $user->getId());
            $item->set(time());
            $item->expiresAfter(180);
            $cache->save($item);

            $data = json_decode($request->getContent(), true) ?? [];
            if (!empty($data['version'])) {
                $verItem = $cache->getItem('extension_version_' . $user->getId());
                $verItem->set((string)$data['version']);
                $verItem->expiresAfter(604800);
                $cache->save($verItem);
            }
        }
        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/api/extension/status', name: 'api_extension_status_legacy', methods: ['GET'])]
    #[Route('/api/v2/extension/status', name: 'api_extension_status', methods: ['GET'])]
    public function status(#[CurrentUser] ?User $user, CacheItemPoolInterface $cache): JsonResponse
    {
        $isActive = false;
        $lastVersion = null;
        if ($user !== null) {
            $item = $cache->getItem('extension_active_' . $user->getId());
            if ($item->isHit()) {
                $ts = (int)$item->get();
                if (time() - $ts < 120) {
                    $isActive = true;
                }
            }
            $verItem = $cache->getItem('extension_version_' . $user->getId());
            if ($verItem->isHit()) {
                $lastVersion = $verItem->get();
            }
        }

        return new JsonResponse([
            'active' => $isActive,
            'extension_id' => null,
            'last_known_version' => $lastVersion,
        ]);
    }

    #[Route('/api/extension/mercure_config', name: 'api_extension_mercure_legacy', methods: ['GET'])]
    #[Route('/api/v2/extension/mercure_config', name: 'api_extension_mercure', methods: ['GET'])]
    public function mercureConfig(
        Request $request,
        MercurePublisherService $mercurePublisher,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        $publicUrl = isset($_SERVER['MERCURE_PUBLIC_URL']) ? (string)$_SERVER['MERCURE_PUBLIC_URL'] : '/.well-known/mercure';
        $topic = $user !== null ? 'vacancies:' . $user->getId() : 'vacancies';
        $response = new JsonResponse([
            'mercure_hub_url' => $publicUrl,
            'topic' => $topic,
        ]);
        $response->headers->set('Cache-Control', 'no-store');

        if ($user !== null) {
            $cookie = $mercurePublisher->createSubscriberCookie($request, (int)$user->getId());
            $response->headers->setCookie($cookie);
        }

        return $response;
    }

    #[Route('/api/extension/add_link', name: 'api_extension_add_link_legacy', methods: ['POST'])]
    #[Route('/api/v2/extension/add_link', name: 'api_extension_add_link', methods: ['POST'])]
    public function enqueueLink(
        Request $request,
        EntityManagerInterface $entityManager,
        MessageBusInterface $messageBus,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $urls = $data['urls'] ?? (!empty($data['url']) ? [$data['url']] : []);
        if (!is_array($urls) || count($urls) === 0) {
            return new JsonResponse(['detail' => 'URL is required'], Response::HTTP_BAD_REQUEST);
        }

        $tasks = [];
        $now = new \DateTimeImmutable();

        foreach ($urls as $url) {
            $url = trim((string)$url);
            if ($url === '') {
                continue;
            }

            $taskId = Uuid::v4()->toRfc4122();
            $item = new ProcessingQueueItem($taskId, $url, 'pending', 'scraping', 0, $now);
            $item->setUser($user);
            $entityManager->persist($item);

            $messageBus->dispatch(new ProcessJobUrlMessage($taskId, $url, $user->getId(), 0));

            $tasks[] = [
                'task_id' => $taskId,
                'url' => $url,
                'status' => 'pending',
            ];
        }

        $entityManager->flush();

        return new JsonResponse([
            'tasks' => $tasks,
            'count' => count($tasks),
        ], Response::HTTP_ACCEPTED);
    }

    #[Route('/api/extension/tasks', name: 'api_extension_tasks_legacy', methods: ['GET'])]
    #[Route('/api/v2/extension/tasks', name: 'api_v2_extension_tasks', methods: ['GET'])]
    public function tasks(#[CurrentUser] ?User $user): JsonResponse
    {
        return new JsonResponse([]);
    }

    #[Route('/api/extension/changelog', name: 'api_extension_changelog_legacy', methods: ['GET'])]
    #[Route('/api/v2/extension/changelog', name: 'api_v2_extension_changelog', methods: ['GET'])]
    public function changelog(): JsonResponse
    {
        $changelogPath = dirname(__DIR__, 3) . '/extension/changelog.json';
        if (file_exists($changelogPath)) {
            $content = file_get_contents($changelogPath);
            if ($content !== false) {
                return new JsonResponse(json_decode($content, true) ?? ['latest_version' => '1.0.7', 'releases' => []]);
            }
        }

        return new JsonResponse([
            'latest_version' => '1.0.7',
            'releases' => [],
        ]);
    }

    #[Route('/api/extension/tasks/{taskId}/result', name: 'api_extension_task_result_legacy', methods: ['POST'])]
    #[Route('/api/v2/extension/tasks/{taskId}/result', name: 'api_v2_extension_task_result', methods: ['POST'])]
    public function taskResult(string $taskId, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/api/extension/tasks/{taskId}/error', name: 'api_extension_task_error_legacy', methods: ['POST'])]
    #[Route('/api/v2/extension/tasks/{taskId}/error', name: 'api_v2_extension_task_error', methods: ['POST'])]
    public function taskError(string $taskId, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/api/extension/log', name: 'api_extension_log_legacy', methods: ['POST'])]
    #[Route('/api/v2/extension/log', name: 'api_v2_extension_log', methods: ['POST'])]
    public function remoteLog(Request $request): JsonResponse
    {
        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/api/extension/parse_and_add', name: 'api_extension_parse_and_add_legacy', methods: ['POST'])]
    #[Route('/api/v2/extension/parse_and_add', name: 'api_v2_extension_parse_and_add', methods: ['POST'])]
    public function parseAndAdd(
        Request $request,
        EntityManagerInterface $entityManager,
        MessageBusInterface $messageBus,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $html = isset($data['html']) ? (string)$data['html'] : '';
        if ($html === '') {
            return new JsonResponse([
                'detail' => 'HTML content is required for parse_and_add. Use /extension/add_link to queue URL.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $url = !empty($data['url']) ? trim((string)$data['url']) : 'https://www.linkedin.com/jobs/view/unknown';
        $taskId = Uuid::v4()->toRfc4122();
        $now = new \DateTimeImmutable();

        $item = new ProcessingQueueItem($taskId, $url, 'pending', 'scraping', 0, $now);
        $item->setUser($user);
        $entityManager->persist($item);
        $entityManager->flush();

        $messageBus->dispatch(new ProcessJobUrlMessage($taskId, $url, $user->getId(), 0));

        return new JsonResponse(['status' => 'queued', 'task_id' => $taskId]);
    }
}
