<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ApprovedCV;
use App\Entity\User;
use App\Entity\Vacancy;
use App\Entity\VacancyCVAnalysis;
use App\Service\Llm\LlmManager;
use App\Service\VacancyScoringService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Uid\Uuid;

class VacancyDetailApiController extends AbstractController
{
    #[Route('/api/v2/vacancies/{id}/compatibility', name: 'api_v2_vacancy_compatibility_get', methods: ['GET'])]
    public function getCompatibility(
        int $id,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_NOT_FOUND);
        }

        /** @var VacancyCVAnalysis|null $analysis */
        $analysis = $entityManager->getRepository(VacancyCVAnalysis::class)->findOneBy([
            'vacancy' => $vacancy,
            'user' => $user,
        ], ['createdAt' => 'DESC']);

        if ($analysis === null) {
            return new JsonResponse(null, Response::HTTP_OK);
        }

        $approvedCv = $entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $user]);
        if ($approvedCv !== null && $analysis->getCvRevision() !== $approvedCv->getRevision()) {
            $analysis->setIsOutdated(true);
        }

        $json = $serializer->serialize($analysis, 'json', ['groups' => ['analysis:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/api/v2/vacancies/{id}/compatibility', name: 'api_v2_vacancy_compatibility_post', methods: ['POST'])]
    public function analyzeCompatibility(
        int $id,
        Request $request,
        EntityManagerInterface $entityManager,
        VacancyScoringService $scoringService,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        /** @var Vacancy|null $vacancy */
        $vacancy = $entityManager->getRepository(Vacancy::class)->findOneBy(['id' => $id, 'user' => $user]);
        if ($vacancy === null) {
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_NOT_FOUND);
        }

        $cv = $entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $user]);
        if ($cv === null || trim((string)$cv->getContent()) === '') {
            return new JsonResponse([
                'detail' => 'No approved CV found. Please upload and approve your CV before requesting compatibility analysis.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $desc = $vacancy->getDescription();
        if ($desc === null || trim($desc) === '') {
            return new JsonResponse([
                'detail' => 'Vacancy has no description. Please provide a description before requesting compatibility analysis.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $scoringService->triggerScoringForVacancy($vacancy, $user);

        $taskId = substr(Uuid::v4()->toRfc4122(), 0, 8);
        $batchId = substr(Uuid::v4()->toRfc4122(), 0, 8);

        return new JsonResponse([
            'status' => 'queued',
            'task_id' => $taskId,
            'batch_id' => $batchId,
            'vacancy_id' => $vacancy->getId(),
            'message' => 'Compatibility analysis enqueued',
        ], Response::HTTP_OK);
    }

    #[Route('/api/v2/vacancies/{id}/adapt-cv', name: 'api_v2_vacancy_adapt_cv', methods: ['POST'])]
    public function adaptCv(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'detail' => 'CV adaptation feature is temporarily disabled.',
        ], Response::HTTP_FORBIDDEN);
    }
}
