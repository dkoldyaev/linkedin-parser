<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ApprovedCV;
use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\Vacancy;
use App\Message\ProcessJobUrlMessage;
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
    #[Route('/vacancies', name: 'public_api_vacancies_list', methods: ['GET'])]
    public function listVacancies(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'API Key required'], Response::HTTP_UNAUTHORIZED);
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

        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_404);
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

        $cv = $entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $user]);
        if ($cv === null) {
            return new JsonResponse(null, Response::HTTP_OK);
        }

        $json = $serializer->serialize($cv, 'json', ['groups' => ['cv:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }
}
