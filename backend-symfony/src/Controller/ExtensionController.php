<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Message\ProcessJobUrlMessage;
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
    public function mercureConfig(#[CurrentUser] ?User $user): JsonResponse
    {
        $publicUrl = isset($_SERVER['MERCURE_PUBLIC_URL']) ? (string)$_SERVER['MERCURE_PUBLIC_URL'] : '/.well-known/mercure';
        return new JsonResponse([
            'mercure_hub_url' => $publicUrl,
            'topic' => $user !== null ? 'vacancies:' . $user->getId() : 'vacancies',
        ]);
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
}
