<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ApprovedCV;
use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\Vacancy;
use App\Entity\VacancyCVAnalysis;
use App\Entity\VacancyStatusHistory;
use App\Message\ProcessJobUrlMessage;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Uid\Uuid;

#[Route('/api/v1')]
class PublicApiController extends AbstractController
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

    #[Route('/vacancies', name: 'public_api_vacancies_list', methods: ['GET'])]
    public function listVacancies(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        $vacancies = $entityManager->getRepository(Vacancy::class)->findBy(['user' => $user], ['id' => 'DESC']);
        $json = $serializer->serialize($vacancies, 'json', ['groups' => ['vacancy:read']]);

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/vacancies/{id}', name: 'public_api_vacancy_get', methods: ['GET'])]
    public function getVacancy(
        int $id,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_NOT_FOUND);
        }

        $json = $serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read', 'vacancy:detail']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/vacancies/batch', name: 'public_api_vacancies_batch', methods: ['POST'])]
    public function batchImport(
        Request $request,
        EntityManagerInterface $entityManager,
        MessageBusInterface $messageBus,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $urls = $data['urls'] ?? [];
        if (!is_array($urls) || count($urls) === 0) {
            return new JsonResponse(['detail' => 'URLs list required'], Response::HTTP_BAD_REQUEST);
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

    #[Route('/cv', name: 'public_api_cv_get', methods: ['GET'])]
    public function getCv(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        $cv = $entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $user]);
        if ($cv === null) {
            return new JsonResponse(null, Response::HTTP_OK);
        }

        $json = $serializer->serialize($cv, 'json', ['groups' => ['cv:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/vacancies', name: 'public_api_vacancies_create', methods: ['POST'])]
    public function createVacancy(
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        MercurePublisherService $mercure,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $title = isset($data['title']) ? (string)$data['title'] : '';
        $company = isset($data['company']) ? (string)$data['company'] : '';

        if ($title === '' || $company === '') {
            return new JsonResponse(['detail' => 'Title and company are required'], Response::HTTP_BAD_REQUEST);
        }

        $now = new \DateTimeImmutable();
        $vacancy = new Vacancy();
        $vacancy->setUser($user);
        $vacancy->setTitle($title);
        $vacancy->setCompany($company);
        $vacancy->setCreatedAt($now);
        $vacancy->setUpdatedAt($now);
        if (isset($data['url'])) {
            $vacancy->setUrl((string)$data['url']);
        }
        if (isset($data['location'])) {
            $vacancy->setLocation((string)$data['location']);
        }
        if (isset($data['status'])) {
            $vacancy->setStatus((string)$data['status']);
        }
        if (isset($data['description'])) {
            $vacancy->setDescription((string)$data['description']);
        }
        if (isset($data['notes'])) {
            $vacancy->setNotes((string)$data['notes']);
        }

        $entityManager->persist($vacancy);
        $entityManager->flush();

        $json = $serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read', 'vacancy:detail']]);
        $vacancyArray = json_decode($json, true) ?? [];

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_VACANCY_CREATED,
            MercurePublisherService::MSG_VACANCY_CREATED,
            ['vacancy' => $vacancyArray]
        );

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/vacancies/{id}', name: 'public_api_vacancies_update', methods: ['PATCH'])]
    public function updateVacancy(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        MercurePublisherService $mercure,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['title'])) {
            $vacancy->setTitle((string)$data['title']);
        }
        if (isset($data['company'])) {
            $vacancy->setCompany((string)$data['company']);
        }
        if (isset($data['status']) && $data['status'] !== $vacancy->getStatus()) {
            $oldStatus = $vacancy->getStatus();
            $newStatus = (string)$data['status'];
            $history = new VacancyStatusHistory(
                $vacancy,
                $oldStatus,
                $newStatus,
                $vacancy->getLane(),
                $vacancy->getLane(),
                isset($data['status_comment']) ? (string)$data['status_comment'] : null,
                new \DateTimeImmutable()
            );
            $vacancy->setStatus($newStatus);
            $entityManager->persist($history);
        }
        if (isset($data['notes'])) {
            $vacancy->setNotes((string)$data['notes']);
        }
        $vacancy->setUpdatedAt(new \DateTimeImmutable());
        $entityManager->flush();

        $json = $serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read', 'vacancy:detail']]);
        $vacancyArray = json_decode($json, true) ?? [];

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_VACANCY_UPDATED,
            MercurePublisherService::MSG_VACANCY_UPDATED,
            ['vacancy' => $vacancyArray]
        );

        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/vacancies/{id}', name: 'public_api_vacancies_delete', methods: ['DELETE'])]
    public function deleteVacancy(
        int $id,
        EntityManagerInterface $entityManager,
        MercurePublisherService $mercure,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_NOT_FOUND);
        }

        $title = $vacancy->getTitle();
        $entityManager->remove($vacancy);
        $entityManager->flush();

        $mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_VACANCY_DELETED,
            MercurePublisherService::MSG_VACANCY_DELETED,
            ['vacancy_id' => $id, 'title' => $title]
        );

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/vacancies/{id}/history', name: 'public_api_vacancies_history', methods: ['GET'])]
    public function getVacancyHistory(
        int $id,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_NOT_FOUND);
        }

        $historyItems = $entityManager->getRepository(VacancyStatusHistory::class)->findBy(
            ['vacancy' => $vacancy],
            ['createdAt' => 'DESC']
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

    #[Route('/vacancies/{id}/compatibility', name: 'public_api_vacancies_compatibility', methods: ['GET'])]
    public function getVacancyCompatibility(
        int $id,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
        }
        $accessCheck = $this->checkApiAccess($user);
        if ($accessCheck !== null) {
            return $accessCheck;
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_NOT_FOUND);
        }

        $analysis = $entityManager->getRepository(VacancyCVAnalysis::class)->findOneBy([
            'vacancy' => $vacancy,
            'user' => $user,
        ], ['createdAt' => 'DESC']);

        if ($analysis === null) {
            return new JsonResponse(null, Response::HTTP_OK);
        }

        $json = $serializer->serialize($analysis, 'json', ['groups' => ['analysis:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }
}
