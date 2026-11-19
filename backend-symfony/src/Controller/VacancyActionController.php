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

use App\Service\Mercure\MercurePublisherService;
use Symfony\Component\Serializer\SerializerInterface;

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

    #[Route('/api/v2/vacancies/{id}/history', name: 'api_v2_vacancies_history_add', methods: ['POST'])]
    public function addHistoryEntry(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        MercurePublisherService $mercure,
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

        $data = json_decode($request->getContent(), true) ?? [];
        $toStatus = isset($data['to_status']) ? (string)$data['to_status'] : '';
        if ($toStatus === '') {
            return new JsonResponse(['detail' => 'to_status is required'], Response::HTTP_BAD_REQUEST);
        }

        $fromStatus = isset($data['from_status']) ? (string)$data['from_status'] : $vacancy->getStatus();
        $fromLane = isset($data['from_lane']) ? (int)$data['from_lane'] : $vacancy->getLane();
        $toLane = isset($data['to_lane']) ? (int)$data['to_lane'] : $vacancy->getLane();
        $comment = isset($data['comment']) ? (string)$data['comment'] : null;

        $now = new \DateTimeImmutable();
        $history = new VacancyStatusHistory($vacancy, $fromStatus, $toStatus, $fromLane, $toLane, $comment, $now);
        $vacancy->setStatus($toStatus);
        $vacancy->setLane($toLane);
        $vacancy->setUpdatedAt($now);

        $entityManager->persist($history);
        $entityManager->flush();

        $json = $serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read']]);
        $vacancyArray = json_decode($json, true) ?? [];

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_VACANCY_UPDATED,
            MercurePublisherService::MSG_VACANCY_UPDATED,
            ['vacancy' => $vacancyArray]
        );

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/api/v2/vacancies/{id}/history/{historyId}', name: 'api_v2_vacancies_history_update', methods: ['PATCH'])]
    public function updateHistoryEntry(
        int $id,
        int $historyId,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        MercurePublisherService $mercure,
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

        /** @var VacancyStatusHistory|null $history */
        $history = $entityManager->getRepository(VacancyStatusHistory::class)->findOneBy([
            'id' => $historyId,
            'vacancy' => $vacancy,
        ]);
        if ($history === null) {
            return new JsonResponse(['detail' => 'History record not found'], Response::HTTP_404);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        if (array_key_exists('comment', $data)) {
            $history->setComment($data['comment'] !== null ? (string)$data['comment'] : null);
        }
        $history->setUpdatedAt(new \DateTimeImmutable());
        $entityManager->flush();

        $json = $serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read']]);
        $vacancyArray = json_decode($json, true) ?? [];

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_VACANCY_UPDATED,
            MercurePublisherService::MSG_VACANCY_UPDATED,
            ['vacancy' => $vacancyArray]
        );

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/api/v2/vacancies/{id}/history/{historyId}', name: 'api_v2_vacancies_history_delete', methods: ['DELETE'])]
    public function deleteHistoryEntry(
        int $id,
        int $historyId,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        MercurePublisherService $mercure,
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

        /** @var VacancyStatusHistory|null $history */
        $history = $entityManager->getRepository(VacancyStatusHistory::class)->findOneBy([
            'id' => $historyId,
            'vacancy' => $vacancy,
        ]);
        if ($history === null) {
            return new JsonResponse(['detail' => 'History record not found'], Response::HTTP_404);
        }

        $entityManager->remove($history);
        $entityManager->flush();

        $json = $serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read']]);
        $vacancyArray = json_decode($json, true) ?? [];

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_VACANCY_UPDATED,
            MercurePublisherService::MSG_VACANCY_UPDATED,
            ['vacancy' => $vacancyArray]
        );

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/api/v2/vacancies/{id}/reparse', name: 'api_v2_vacancies_reparse', methods: ['POST'])]
    public function reparseVacancy(
        int $id,
        EntityManagerInterface $entityManager,
        MessageBusInterface $messageBus,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Вакансия не найдена'], Response::HTTP_404);
        }

        if (empty($vacancy->getUrl())) {
            return new JsonResponse(['detail' => 'У вакансии отсутствует ссылка (URL)'], Response::HTTP_BAD_REQUEST);
        }

        $url = trim($vacancy->getUrl());
        $taskId = Uuid::v4()->toRfc4122();
        $now = new \DateTimeImmutable();

        $item = new ProcessingQueueItem($taskId, $url, 'pending', 'scraping', 0, $now);
        $item->setUser($user);
        $entityManager->persist($item);
        $entityManager->flush();

        $messageBus->dispatch(new ProcessJobUrlMessage($taskId, $url, $user->getId(), 0));

        return new JsonResponse([
            'status' => 'queued',
            'task_id' => $taskId,
            'vacancy_id' => $vacancy->getId(),
            'message' => 'Вакансия поставлена в очередь на повторный парсинг',
        ]);
    }

    #[Route('/api/v2/vacancies/{id}/resummarize', name: 'api_v2_vacancies_resummarize', methods: ['POST'])]
    public function resummarizeVacancy(
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

        if (empty($vacancy->getDescription())) {
            return new JsonResponse([
                'detail' => 'Vacancy has no description. Please provide a description before requesting AI summarization.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $taskId = Uuid::v4()->toRfc4122();

        return new JsonResponse([
            'status' => 'queued',
            'task_id' => $taskId,
            'vacancy_id' => $vacancy->getId(),
            'message' => 'AI summarization task enqueued',
        ]);
    }

    #[Route('/api/v2/vacancies/reparse_all', name: 'api_v2_vacancies_reparse_all', methods: ['POST'])]
    public function reparseAll(
        Request $request,
        EntityManagerInterface $entityManager,
        MessageBusInterface $messageBus,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $selectedIds = $data['ids'] ?? [];

        $repo = $entityManager->getRepository(Vacancy::class);
        if (!empty($selectedIds) && is_array($selectedIds)) {
            $vacancies = $repo->findBy(['user' => $user, 'id' => $selectedIds]);
        } else {
            $vacancies = $repo->findBy(['user' => $user]);
        }

        $enqueued = 0;
        $now = new \DateTimeImmutable();

        foreach ($vacancies as $v) {
            $url = trim((string)$v->getUrl());
            if ($url === '') {
                continue;
            }
            $taskId = Uuid::v4()->toRfc4122();
            $item = new ProcessingQueueItem($taskId, $url, 'pending', 'scraping', 0, $now);
            $item->setUser($user);
            $entityManager->persist($item);

            $messageBus->dispatch(new ProcessJobUrlMessage($taskId, $url, $user->getId(), 0));
            $enqueued++;
        }

        $entityManager->flush();

        return new JsonResponse([
            'message' => $enqueued > 0 ? sprintf('Поставлено в очередь: %d', $enqueued) : 'Нет вакансий для обновления',
            'enqueued' => $enqueued,
        ]);
    }
}
