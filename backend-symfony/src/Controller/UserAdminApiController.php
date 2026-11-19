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
            $result[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName() ?? $user->getEmail(),
                'picture' => $user->getAvatar(),
                'feature_flags' => $flags,
                'is_anonymous' => false,
                'created_at' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return new JsonResponse($result);
    }

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
