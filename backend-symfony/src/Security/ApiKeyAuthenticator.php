<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\ApiKey;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class ApiKeyAuthenticator extends AbstractAuthenticator
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('X-API-Key') && trim((string)$request->headers->get('X-API-Key')) !== '';
    }

    public function authenticate(Request $request): Passport
    {
        $apiKeyValue = $request->headers->get('X-API-Key');
        if ($apiKeyValue === null || trim($apiKeyValue) === '') {
            throw new CustomUserMessageAuthenticationException('Missing X-API-Key header');
        }

        $keyHash = hash('sha256', trim($apiKeyValue));
        $apiKeyRepo = $this->entityManager->getRepository(ApiKey::class);
        /** @var ApiKey|null $apiKey */
        $apiKey = $apiKeyRepo->findOneBy(['keyHash' => $keyHash]);

        if ($apiKey === null) {
            throw new CustomUserMessageAuthenticationException('Invalid API Key');
        }

        $path = $request->getPathInfo();
        if (preg_match('#^/api/v2/(settings|api-keys)#', $path)) {
            throw new CustomUserMessageAuthenticationException('api_key_not_allowed');
        }

        $apiKey->setLastUsedAt(new \DateTimeImmutable());
        $apiKey->setRequestCount($apiKey->getRequestCount() + 1);
        $this->entityManager->flush();

        $user = $apiKey->getUser();
        if ($user === null) {
            throw new CustomUserMessageAuthenticationException('API Key has no associated user');
        }

        $hasApiAccess = false;
        foreach ($user->getFeatureFlags() as $flag) {
            if ($flag->getFlag() === 'api_access') {
                $hasApiAccess = true;
                break;
            }
        }

        if (!$hasApiAccess && !$user->isAdmin()) {
            throw new CustomUserMessageAuthenticationException('api_access_forbidden');
        }

        return new SelfValidatingPassport(new UserBadge($user->getUserIdentifier()));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        if ($exception->getMessageKey() === 'api_key_not_allowed') {
            return new JsonResponse([
                'detail' => 'API key access is not allowed on this endpoint. Use browser session.',
            ], Response::HTTP_FORBIDDEN);
        }

        $status = $exception->getMessageKey() === 'api_access_forbidden'
            ? Response::HTTP_FORBIDDEN
            : Response::HTTP_UNAUTHORIZED;

        $detail = $status === Response::HTTP_FORBIDDEN
            ? 'API access feature flag required'
            : $exception->getMessageKey();

        return new JsonResponse([
            'detail' => $detail,
        ], $status);
    }
}
