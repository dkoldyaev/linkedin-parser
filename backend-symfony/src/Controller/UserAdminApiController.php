<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ApiKey;
use App\Entity\ApprovedCV;
use App\Entity\User;
use App\Entity\UserFeatureFlag;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Serializer\SerializerInterface;

class UserAdminApiController extends AbstractController
{
    #[Route('/api/v2/users', name: 'api_v2_users_list', methods: ['GET'])]
    #[Route('/api/v2/admin/users', name: 'api_v2_admin_users_list', methods: ['GET'])]
    public function listUsers(
        UserRepository $userRepository,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$currentUser->isAdmin()) {
            return new JsonResponse(['detail' => 'Admin access required'], Response::HTTP_FORBIDDEN);
        }

        $users = $userRepository->findBy([], ['id' => 'ASC']);
        $result = [];
        foreach ($users as $user) {
            $flags = [];
            foreach ($user->getFeatureFlags() as $flag) {
                $flags[] = $flag->getFlag();
            }

            // Vacancy stats
            $vacancies = $user->getVacancies();
            $byStatus = [];
            $maxVacUpdated = null;
            foreach ($vacancies as $v) {
                $st = $v->getStatus();
                $byStatus[$st] = ($byStatus[$st] ?? 0) + 1;
                $up = $v->getUpdatedAt();
                if ($maxVacUpdated === null || $up > $maxVacUpdated) {
                    $maxVacUpdated = $up;
                }
            }

            // LLM tokens stats
            $tokenUsages = $user->getTokenUsages();
            $totalTokens = 0;
            $promptTokens = 0;
            $completionTokens = 0;
            $totalRequests = 0;
            $byProvider = [];
            foreach ($tokenUsages as $tu) {
                $p = $tu->getProvider();
                $tot = $tu->getTotalTokens();
                $prm = $tu->getPromptTokens();
                $cmp = $tu->getCompletionTokens();

                $totalTokens += $tot;
                $promptTokens += $prm;
                $completionTokens += $cmp;
                $totalRequests++;

                if (!isset($byProvider[$p])) {
                    $byProvider[$p] = [
                        'total_tokens' => 0,
                        'prompt_tokens' => 0,
                        'completion_tokens' => 0,
                        'requests' => 0,
                    ];
                }
                $byProvider[$p]['total_tokens'] += $tot;
                $byProvider[$p]['prompt_tokens'] += $prm;
                $byProvider[$p]['completion_tokens'] += $cmp;
                $byProvider[$p]['requests'] += 1;
            }

            $apiKeys = $user->getApiKeys();
            $apiReqTotal = 0;
            foreach ($apiKeys as $ak) {
                $apiReqTotal += $ak->getRequestCount();
            }

            $stats = [
                'total_vacancies' => count($vacancies),
                'by_status' => $byStatus,
                'last_login_at' => null,
                'last_board_interaction_at' => $maxVacUpdated !== null ? $maxVacUpdated->format(\DateTimeInterface::ATOM) : null,
                'api_keys_count' => count($apiKeys),
                'api_requests_count' => $apiReqTotal,
                'llm_tokens' => [
                    'total_tokens' => $totalTokens,
                    'prompt_tokens' => $promptTokens,
                    'completion_tokens' => $completionTokens,
                    'total_requests' => $totalRequests,
                    'by_provider' => $byProvider,
                ],
            ];

            $result[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName() ?? $user->getEmail(),
                'picture' => $user->getAvatar(),
                'feature_flags' => $flags,
                'is_anonymous' => false,
                'created_at' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'stats' => $stats,
            ];
        }

        return new JsonResponse($result);
    }

    #[Route('/api/auth/me/feature-flags', name: 'api_update_my_feature_flags_legacy', methods: ['PUT'])]
    #[Route('/api/v2/auth/me/feature-flags', name: 'api_v2_update_my_feature_flags', methods: ['PUT'])]
    public function updateMyFeatureFlags(
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $flags = $data['feature_flags'] ?? [];

        if (in_array('admin', $flags, true) && !$currentUser->isAdmin()) {
            return new JsonResponse(['detail' => 'Only administrators can grant admin'], Response::HTTP_FORBIDDEN);
        }

        // Remove old flags
        foreach ($currentUser->getFeatureFlags() as $existingFlag) {
            $entityManager->remove($existingFlag);
        }
        $entityManager->flush();

        // Add new
        $now = new \DateTimeImmutable();
        foreach ($flags as $flagName) {
            $flag = new UserFeatureFlag($currentUser, (string)$flagName, $now);
            $entityManager->persist($flag);
        }
        $entityManager->flush();

        $updatedFlags = [];
        foreach ($currentUser->getFeatureFlags() as $f) {
            $updatedFlags[] = $f->getFlag();
        }

        return new JsonResponse([
            'id' => $currentUser->getId(),
            'email' => $currentUser->getEmail(),
            'name' => $currentUser->getName() ?? $currentUser->getEmail(),
            'picture' => $currentUser->getAvatar(),
            'feature_flags' => $updatedFlags,
            'is_anonymous' => false,
            'created_at' => $currentUser->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/api/v2/users/{userId}/feature-flags', name: 'api_v2_users_feature_flags_update', methods: ['PUT'])]
    public function updateUserFeatureFlags(
        int $userId,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $isAdmin = $currentUser->isAdmin();
        if ($userId !== $currentUser->getId() && !$isAdmin) {
            return new JsonResponse(['detail' => 'Admin access required'], Response::HTTP_FORBIDDEN);
        }

        $targetUser = $userRepository->find($userId);
        if ($targetUser === null) {
            return new JsonResponse(['detail' => 'User not found'], Response::HTTP_404);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $flags = $data['feature_flags'] ?? [];

        if (in_array('admin', $flags, true) && !$isAdmin) {
            return new JsonResponse(['detail' => 'Only administrators can grant admin'], Response::HTTP_FORBIDDEN);
        }

        foreach ($targetUser->getFeatureFlags() as $existingFlag) {
            $entityManager->remove($existingFlag);
        }
        $entityManager->flush();

        $now = new \DateTimeImmutable();
        foreach ($flags as $flagName) {
            $flag = new UserFeatureFlag($targetUser, (string)$flagName, $now);
            $entityManager->persist($flag);
        }
        $entityManager->flush();

        $updatedFlags = [];
        foreach ($targetUser->getFeatureFlags() as $f) {
            $updatedFlags[] = $f->getFlag();
        }

        return new JsonResponse([
            'id' => $targetUser->getId(),
            'email' => $targetUser->getEmail(),
            'name' => $targetUser->getName() ?? $targetUser->getEmail(),
            'picture' => $targetUser->getAvatar(),
            'feature_flags' => $updatedFlags,
            'is_anonymous' => false,
            'created_at' => $targetUser->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/api/v2/admin/users/{userId}', name: 'api_v2_admin_users_update', methods: ['PATCH'])]
    public function adminUpdateUser(
        int $userId,
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }
        if (!$currentUser->isAdmin()) {
            return new JsonResponse(['detail' => 'Admin access required'], Response::HTTP_FORBIDDEN);
        }

        $targetUser = $userRepository->find($userId);
        if ($targetUser === null) {
            return new JsonResponse(['detail' => 'User not found'], Response::HTTP_404);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['feature_flags']) && is_array($data['feature_flags'])) {
            foreach ($targetUser->getFeatureFlags() as $existingFlag) {
                $entityManager->remove($existingFlag);
            }
            $entityManager->flush();

            $now = new \DateTimeImmutable();
            foreach ($data['feature_flags'] as $flagName) {
                $flag = new UserFeatureFlag($targetUser, (string)$flagName, $now);
                $entityManager->persist($flag);
            }
            $entityManager->flush();
        }

        $updatedFlags = [];
        foreach ($targetUser->getFeatureFlags() as $f) {
            $updatedFlags[] = $f->getFlag();
        }

        return new JsonResponse([
            'id' => $targetUser->getId(),
            'email' => $targetUser->getEmail(),
            'name' => $targetUser->getName() ?? $targetUser->getEmail(),
            'picture' => $targetUser->getAvatar(),
            'feature_flags' => $updatedFlags,
            'is_anonymous' => false,
            'created_at' => $targetUser->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ]);
    }

    #[Route('/api/v2/api-keys', name: 'api_v2_api_keys_create', methods: ['POST'])]
    public function createApiKey(
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $hasApiAccess = $currentUser->isAdmin();
        foreach ($currentUser->getFeatureFlags() as $f) {
            if ($f->getFlag() === 'api_access' || $f->getFlag() === 'admin') {
                $hasApiAccess = true;
                break;
            }
        }

        if (!$hasApiAccess) {
            return new JsonResponse([
                'detail' => 'API access is disabled for your account (missing feature flag api_access)',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $rawToken = 'ak_' . bin2hex(random_bytes(24));
        $keyHash = hash('sha256', $rawToken);
        $keyPrefix = substr($rawToken, 0, 10);
        $name = !empty($data['name']) ? trim((string)$data['name']) : 'Default API Key';

        $apiKey = new ApiKey($currentUser, $keyHash, $name, $keyPrefix, new \DateTimeImmutable());
        $entityManager->persist($apiKey);
        $entityManager->flush();

        return new JsonResponse([
            'id' => $apiKey->getId(),
            'name' => $apiKey->getName(),
            'key_prefix' => $apiKey->getPrefix(),
            'api_key' => $rawToken,
            'created_at' => $apiKey->getCreatedAt()->format('Y-m-d\TH:i:s'),
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/v2/api-keys/{keyId}', name: 'api_v2_api_keys_delete', methods: ['DELETE'])]
    public function revokeApiKey(
        int $keyId,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $key = $entityManager->getRepository(ApiKey::class)->findOneBy(['id' => $keyId, 'user' => $currentUser]);
        if ($key === null) {
            return new JsonResponse(['detail' => 'API key not found'], Response::HTTP_404);
        }

        $entityManager->remove($key);
        $entityManager->flush();

        return new JsonResponse(['status' => 'ok', 'message' => 'API key revoked']);
    }

    #[Route('/api/v2/cv', name: 'api_v2_cv_save', methods: ['POST'])]
    public function saveCv(
        Request $request,
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $content = isset($data['content']) ? (string)$data['content'] : '';
        $revision = isset($data['revision']) ? (int)$data['revision'] : 1;
        $parsedProfile = isset($data['parsed_profile']) && is_array($data['parsed_profile']) ? $data['parsed_profile'] : null;

        $now = new \DateTimeImmutable();
        $cvRepo = $entityManager->getRepository(ApprovedCV::class);
        $cv = $cvRepo->findOneBy(['user' => $currentUser]);

        if ($cv !== null) {
            $cv->setContent($content);
            $cv->setRevision($revision);
            $cv->setParsedProfile($parsedProfile);
            $cv->setUpdatedAt($now);
        } else {
            $cv = new ApprovedCV($currentUser, $content, $parsedProfile, $revision, $now);
            $entityManager->persist($cv);
        }

        $entityManager->flush();
        $json = $serializer->serialize($cv, 'json', ['groups' => ['cv:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }

    #[Route('/api/v2/cv', name: 'api_v2_cv_delete', methods: ['DELETE'])]
    public function deleteCv(
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $cv = $entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $currentUser]);
        if ($cv !== null) {
            $entityManager->remove($cv);
            $entityManager->flush();
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/api/v2/api-keys', name: 'api_v2_api_keys_list', methods: ['GET'])]
    public function listApiKeys(
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $keys = $entityManager->getRepository(ApiKey::class)->findBy(['user' => $currentUser]);
        $result = [];
        foreach ($keys as $k) {
            $result[] = [
                'id' => $k->getId(),
                'name' => $k->getName(),
                'prefix' => $k->getPrefix(),
                'created_at' => $k->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'last_used_at' => $k->getLastUsedAt()?->format(\DateTimeInterface::ATOM),
            ];
        }

        return new JsonResponse($result);
    }

    #[Route('/api/v2/cv', name: 'api_v2_cv_get', methods: ['GET'])]
    public function getCv(
        EntityManagerInterface $entityManager,
        SerializerInterface $serializer,
        #[CurrentUser] ?User $currentUser
    ): JsonResponse {
        if ($currentUser === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $cv = $entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $currentUser]);
        if ($cv === null) {
            return new JsonResponse(null, Response::HTTP_OK);
        }

        $json = $serializer->serialize($cv, 'json', ['groups' => ['cv:read']]);
        return new JsonResponse($json, Response::HTTP_OK, [], true);
    }
}
