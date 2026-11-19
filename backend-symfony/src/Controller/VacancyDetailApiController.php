<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ApprovedCV;
use App\Entity\User;
use App\Entity\Vacancy;
use App\Entity\VacancyCVAnalysis;
use App\Service\Llm\LlmManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;

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
            return new JsonResponse(['detail' => 'Vacancy not found'], Response::HTTP_404);
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

    #[Route('/api/v2/vacancies/{id}/compatibility', name: 'api_v2_vacancy_compatibility_post', methods: ['POST'])]
    public function analyzeCompatibility(
        int $id,
        EntityManagerInterface $entityManager,
        LlmManager $llmManager,
        SerializerInterface $serializer,
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

        $cv = $entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $user]);
        if ($cv === null) {
            return new JsonResponse(['detail' => 'No approved CV found'], Response::HTTP_BAD_REQUEST);
        }

        $provider = $llmManager->getDefaultProvider();
        $compatResult = $provider->evaluateCompatibility(
            $vacancy->getDescription() ?? $vacancy->getTitle(),
            $cv->getContent(),
            'ru',
            []
        );

        $now = new \DateTimeImmutable();
        $analysis = new VacancyCVAnalysis(
            $user,
            $vacancy,
            $cv->getRevision(),
            'v1.0',
            $provider->getName(),
            (float)($compatResult['overallScore'] ?? 80.0),
            $compatResult,
            null,
            $now
        );

        $vacancy->setMatchScore((float)($compatResult['overallScore'] ?? 80.0));
        $entityManager->persist($analysis);
        $entityManager->flush();

        $json = $serializer->serialize($analysis, 'json', ['groups' => ['analysis:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
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
