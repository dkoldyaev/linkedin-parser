<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class AuthController extends AbstractController
{
    #[Route('/api/health', name: 'api_health_legacy', methods: ['GET'])]
    #[Route('/api/v2/health', name: 'api_health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/api/auth/config', name: 'api_auth_config_legacy', methods: ['GET'])]
    #[Route('/api/v2/auth/config', name: 'api_auth_config', methods: ['GET'])]
    public function authConfig(): JsonResponse
    {
        $googleClientId = isset($_SERVER['GOOGLE_CLIENT_ID']) ? (string)$_SERVER['GOOGLE_CLIENT_ID'] : '';
        $devAuth = isset($_SERVER['DEV_AUTH']) ? ($_SERVER['DEV_AUTH'] === 'true' || $_SERVER['DEV_AUTH'] === '1') : true;

        return new JsonResponse([
            'google_configured' => $googleClientId !== '',
            'google_client_id' => $googleClientId,
            'dev_mode' => $devAuth,
        ]);
    }

    #[Route('/api/v2/feature-flags', name: 'api_feature_flags', methods: ['GET'])]
    public function availableFeatureFlags(): JsonResponse
    {
        return new JsonResponse([
            'available_flags' => ['api_access', 'admin'],
        ]);
    }

    #[Route('/api/v2/mercure-config', name: 'api_mercure_config', methods: ['GET'])]
    public function mercureConfig(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }
        $publicUrl = isset($_SERVER['MERCURE_PUBLIC_URL']) ? (string)$_SERVER['MERCURE_PUBLIC_URL'] : '/.well-known/mercure';
        return new JsonResponse([
            'mercure_hub_url' => $publicUrl,
            'mercure_topic' => 'vacancies:' . $user->getId(),
        ]);
    }

    #[Route('/api/v2/auth/dev-login', name: 'api_auth_dev_login', methods: ['POST'])]
    public function devLogin(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true) ?? [];
        $email = !empty($data['email']) ? (string)$data['email'] : 'dev@local.user';
        $name = !empty($data['name']) ? (string)$data['name'] : 'Dev User';

        $user = $userRepository->findByEmail($email);
        $now = new \DateTimeImmutable();

        if ($user === null) {
            $user = new User(
                $email,
                $name,
                'https://api.dicebear.com/7.x/bottts/svg?seed=dev',
                true,
                ['ROLE_USER', 'ROLE_ADMIN'],
                $now
            );
            $entityManager->persist($user);
            $entityManager->flush();
        }

        $token = $jwtManager->create($user);

        $flags = [];
        foreach ($user->getFeatureFlags() as $flag) {
            $flags[] = $flag->getFlag();
        }

        $userResponseData = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName() ?? $user->getEmail(),
            'picture' => $user->getAvatar(),
            'feature_flags' => $flags,
            'is_anonymous' => false,
            'created_at' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];

        $response = new JsonResponse([
            'user' => $userResponseData,
            'token' => $token,
        ]);

        $cookie = Cookie::create('access_token')
            ->withValue($token)
            ->withExpires(time() + 86400 * 30)
            ->withPath('/')
            ->withHttpOnly(true)
            ->withSameSite('lax');

        $response->headers->setCookie($cookie);

        return $response;
    }

    #[Route('/api/auth/me', name: 'api_auth_me_legacy', methods: ['GET'])]
    #[Route('/api/v2/auth/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        $isAnonymous = false;
        $cookieToSet = null;

        if ($user === null) {
            $anonId = substr(bin2hex(random_bytes(6)), 0, 12);
            $user = new User(
                'guest_' . $anonId . '@guest.local',
                'Гость',
                'https://api.dicebear.com/7.x/bottts/svg?seed=guest_' . $anonId,
                false,
                ['ROLE_USER'],
                new \DateTimeImmutable()
            );
            $entityManager->persist($user);
            $entityManager->flush();
            $isAnonymous = true;

            $token = $jwtManager->create($user);
            $cookieToSet = Cookie::create('access_token')
                ->withValue($token)
                ->withExpires(time() + 86400 * 30)
                ->withPath('/')
                ->withHttpOnly(true)
                ->withSameSite('lax');
        }

        $flags = [];
        foreach ($user->getFeatureFlags() as $flag) {
            $flags[] = $flag->getFlag();
        }

        $apiKeysData = [];
        foreach ($user->getApiKeys() as $key) {
            $apiKeysData[] = [
                'id' => $key->getId(),
                'name' => $key->getName(),
                'key_prefix' => $key->getPrefix(),
                'created_at' => $key->getCreatedAt()->format('Y-m-d\TH:i:s'),
                'last_used_at' => $key->getLastUsedAt() !== null ? $key->getLastUsedAt()->format('Y-m-d\TH:i:s') : null,
                'request_count' => $key->getRequestCount(),
            ];
        }

        $response = new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName() ?? $user->getEmail(),
            'picture' => $user->getAvatar(),
            'feature_flags' => $flags,
            'is_anonymous' => $isAnonymous,
            'created_at' => $user->getCreatedAt()->format('Y-m-d\TH:i:s'),
            'last_login_at' => (new \DateTimeImmutable())->format('Y-m-d\TH:i:s'),
            'last_board_interaction_at' => null,
            'stats' => null,
            'api_keys' => $apiKeysData,
        ]);

        if ($cookieToSet !== null) {
            $response->headers->setCookie($cookieToSet);
        }

        return $response;
    }

    #[Route('/api/v2/auth/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        $response = new JsonResponse(['status' => 'logged_out']);
        $response->headers->clearCookie('access_token', '/');
        return $response;
    }

    #[Route('/api/auth/google/login', name: 'api_auth_google_login_legacy', methods: ['GET'])]
    #[Route('/api/v2/auth/google/login', name: 'api_auth_google_login', methods: ['GET'])]
    public function googleLogin(Request $request): Response
    {
        $clientId = isset($_SERVER['GOOGLE_CLIENT_ID']) ? (string)$_SERVER['GOOGLE_CLIENT_ID'] : '';
        $clientSecret = isset($_SERVER['GOOGLE_CLIENT_SECRET']) ? (string)$_SERVER['GOOGLE_CLIENT_SECRET'] : '';

        if ($clientId === '' || $clientSecret === '') {
            return new JsonResponse([
                'detail' => 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
            ], Response::HTTP_BAD_REQUEST);
        }

        $redirectUri = isset($_SERVER['GOOGLE_REDIRECT_URI']) && (string)$_SERVER['GOOGLE_REDIRECT_URI'] !== ''
            ? (string)$_SERVER['GOOGLE_REDIRECT_URI']
            : rtrim($request->getSchemeAndHttpHost(), '/') . '/api/v2/auth/google/callback';

        $state = bin2hex(random_bytes(16));
        $params = [
            'client_id' => $clientId,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'consent',
        ];

        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
        $response = $this->redirect($authUrl);
        $cookie = Cookie::create('oauth_state')
            ->withValue($state)
            ->withExpires(time() + 600)
            ->withPath('/')
            ->withHttpOnly(true)
            ->withSameSite('lax')
            ->withSecure(str_starts_with($redirectUri, 'https://'));
        $response->headers->setCookie($cookie);

        return $response;
    }

    #[Route('/api/auth/google/callback', name: 'api_auth_google_callback_legacy', methods: ['GET'])]
    #[Route('/api/v2/auth/google/callback', name: 'api_auth_google_callback', methods: ['GET'])]
    public function googleCallback(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager
    ): Response {
        $code = (string)$request->query->get('code');
        $state = (string)$request->query->get('state');
        $cookieState = (string)$request->cookies->get('oauth_state');

        if ($code === '' || $state === '' || !hash_equals($cookieState, $state)) {
            return new JsonResponse(['detail' => 'Invalid OAuth state'], Response::HTTP_BAD_REQUEST);
        }

        $clientId = isset($_SERVER['GOOGLE_CLIENT_ID']) ? (string)$_SERVER['GOOGLE_CLIENT_ID'] : '';
        $clientSecret = isset($_SERVER['GOOGLE_CLIENT_SECRET']) ? (string)$_SERVER['GOOGLE_CLIENT_SECRET'] : '';
        $redirectUri = isset($_SERVER['GOOGLE_REDIRECT_URI']) && (string)$_SERVER['GOOGLE_REDIRECT_URI'] !== ''
            ? (string)$_SERVER['GOOGLE_REDIRECT_URI']
            : rtrim($request->getSchemeAndHttpHost(), '/') . '/api/v2/auth/google/callback';

        return $this->redirect('/');
    }
}
