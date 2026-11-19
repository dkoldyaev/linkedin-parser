<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\Vacancy;
use App\Entity\VacancyStatusHistory;
use App\Message\ProcessJobUrlMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Uid\Uuid;

class VacancyActionController extends AbstractController
{
    #[Route('/api/v2/vacancies/batch', name: 'api_v2_vacancies_batch', methods: ['POST'])]
    public function batchImport(
        Request $request,
        EntityManagerInterface $entityManager,
        MessageBusInterface $messageBus,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $urls = $data['urls'] ?? [];
        if (!is_array($urls) || count($urls) === 0) {
            return new JsonResponse(['detail' => 'URLs list is required'], Response::HTTP_BAD_REQUEST);
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

    #[Route('/api/v2/vacancies/reorder', name: 'api_v2_vacancies_reorder', methods: ['POST'])]
    public function reorder(
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $items = $data['items'] ?? [];
        if (!is_array($items)) {
            return new JsonResponse(['detail' => 'Items list is required'], Response::HTTP_BAD_REQUEST);
        }

        $repo = $entityManager->getRepository(Vacancy::class);
        $now = new \DateTimeImmutable();

        foreach ($items as $item) {
            $id = isset($item['id']) ? (int)$item['id'] : 0;
            /** @var Vacancy|null $vacancy */
            $vacancy = $repo->findOneBy(['id' => $id, 'user' => $user]);
            if ($vacancy !== null) {
                if (isset($item['status'])) {
                    $vacancy->setStatus((string)$item['status']);
                }
                if (isset($item['lane'])) {
                    $vacancy->setLane((int)$item['lane']);
                }
                if (isset($item['sort_order'])) {
                    $vacancy->setSortOrder((float)$item['sort_order']);
                }
                $vacancy->setUpdatedAt($now);
            }
        }

        $entityManager->flush();

        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/api/v2/vacancies/{id}/history', name: 'api_v2_vacancy_history', methods: ['GET'])]
    public function history(
        int $id,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_404);
        }

        $historyItems = $entityManager->getRepository(VacancyStatusHistory::class)->findBy(
            ['vacancy' => $vacancy],
            ['createdAt' => 'ASC']
        );

        $result = [];
        foreach ($historyItems as $h) {
            $result[] = [
                'id' => $h->getId(),
                'vacancy_id' => $h->getVacancy()->getId(),
                'from_status' => $h->getFromStatus(),
                'to_status' => $h->getToStatus(),
                'from_lane' => $h->getFromLane(),
                'to_lane' => $h->getToLane(),
                'comment' => $h->getComment(),
                'created_at' => $h->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'updated_at' => $h->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return new JsonResponse($result);
    }
}
