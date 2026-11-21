<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ApiKey;
use App\Entity\User;
use App\Entity\UserSetting;
use App\Repository\UserRepository;
use App\Service\Mercure\MercurePublisherService;
use App\Service\RefreshTokenService;
use App\Service\UserMigrationService;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Encoder\JWTEncoderInterface;
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
        $googleClientId = isset($_ENV['GOOGLE_CLIENT_ID']) ? (string)$_ENV['GOOGLE_CLIENT_ID'] : (isset($_SERVER['GOOGLE_CLIENT_ID']) ? (string)$_SERVER['GOOGLE_CLIENT_ID'] : '');
        $devAuthRaw = isset($_ENV['DEV_AUTH']) ? (string)$_ENV['DEV_AUTH'] : (isset($_SERVER['DEV_AUTH']) ? (string)$_SERVER['DEV_AUTH'] : '');
        $devAuth = in_array(strtolower(trim($devAuthRaw)), ['true', '1', 'yes'], true);

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

    #[Route('/api/config', name: 'api_config_legacy', methods: ['GET'])]
    #[Route('/api/mercure-config', name: 'api_mercure_config_legacy', methods: ['GET'])]
    #[Route('/api/v2/mercure-config', name: 'api_mercure_config', methods: ['GET'])]
    public function mercureConfig(
        Request $request,
        MercurePublisherService $mercurePublisher,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }
        $publicUrl = isset($_SERVER['MERCURE_PUBLIC_URL']) ? (string)$_SERVER['MERCURE_PUBLIC_URL'] : '/.well-known/mercure';
        $topic = 'vacancies:' . $user->getId();
        $response = new JsonResponse([
            'mercure_hub_url' => $publicUrl,
            'mercure_topic' => $topic,
        ]);
        $response->headers->set('Cache-Control', 'no-store');

        $cookie = $mercurePublisher->createSubscriberCookie($request, (int)$user->getId());
        $response->headers->setCookie($cookie);

        return $response;
    }

    private function resolveOptionalUser(
        Request $request,
        UserRepository $userRepository,
        JWTEncoderInterface $jwtEncoder,
        EntityManagerInterface $entityManager
    ): ?User {
        $apiKeyHeader = $request->headers->get('X-API-Key') ?? $request->headers->get('x-api-key');
        $authHeader = $request->headers->get('Authorization');

        $candidateApiKey = null;
        if ($apiKeyHeader !== null && trim((string)$apiKeyHeader) !== '') {
            $candidateApiKey = trim((string)$apiKeyHeader);
        } elseif ($authHeader !== null && str_starts_with((string)$authHeader, 'Bearer ')) {
            $bearerVal = trim(substr((string)$authHeader, 7));
            if (str_starts_with($bearerVal, 'ak_')) {
                $candidateApiKey = $bearerVal;
            }
        }

        if ($candidateApiKey !== null) {
            $keyHash = hash('sha256', $candidateApiKey);
            $apiKeyRecord = $entityManager->getRepository(ApiKey::class)->findOneBy(['keyHash' => $keyHash]);
            if ($apiKeyRecord !== null) {
                $user = $apiKeyRecord->getUser();
                if ($user !== null) {
                    $hasApiAccess = false;
                    foreach ($user->getFeatureFlags() as $flag) {
                        if ($flag->getFlag() === 'api_access' || $flag->getFlag() === 'admin') {
                            $hasApiAccess = true;
                            break;
                        }
                    }
                    if ($hasApiAccess) {
                        $apiKeyRecord->setLastUsedAt(new \DateTimeImmutable());
                        $apiKeyRecord->setRequestCount($apiKeyRecord->getRequestCount() + 1);
                        $entityManager->flush();
                        return $user;
                    }
                }
            }
            return null;
        }

        $rawToken = null;
        if ($request->cookies->has('access_token')) {
            $rawToken = (string)$request->cookies->get('access_token');
        } elseif ($authHeader !== null && str_starts_with((string)$authHeader, 'Bearer ')) {
            $bearerVal = trim(substr((string)$authHeader, 7));
            if (!str_starts_with($bearerVal, 'ak_')) {
                $rawToken = $bearerVal;
            }
        }

        if ($rawToken === null || trim($rawToken) === '') {
            return null;
        }

        try {
            $payload = $jwtEncoder->decode($rawToken);
        } catch (\Throwable) {
            return null;
        }

        if (!is_array($payload)) {
            return null;
        }

        $sub = $payload['sub'] ?? ($payload['email'] ?? null);
        if ($sub === null) {
            return null;
        }

        if (is_numeric($sub)) {
            $user = $userRepository->find((int)$sub);
            if ($user !== null) {
                return $user;
            }
        }

        return $userRepository->findByEmail((string)$sub);
    }

    public static function resolveAndPersistUserLocale(
        Request $request,
        EntityManagerInterface $entityManager,
        User $user
    ): string {
        $repo = $entityManager->getRepository(UserSetting::class);
        /** @var UserSetting|null $setting */
        $setting = $repo->findOneBy(['user' => $user, 'key' => 'locale']);
        if ($setting !== null && in_array($setting->getValue(), ['ru', 'en'], true)) {
            return (string)$setting->getValue();
        }

        $resolved = self::parseAcceptLanguage((string)$request->headers->get('Accept-Language', ''));
        $now = new \DateTimeImmutable();
        if ($setting === null) {
            $setting = new UserSetting($user, 'locale', $resolved, $now);
            $entityManager->persist($setting);
        } else {
            $setting->setValue($resolved)->setUpdatedAt($now);
        }
        $entityManager->flush();

        return $resolved;
    }

    public static function parseAcceptLanguage(string $header): string
    {
        if (trim($header) === '') {
            return 'en';
        }

        $candidates = [];
        foreach (explode(',', $header) as $index => $part) {
            $subparts = explode(';', trim($part));
            $tag = strtolower(trim($subparts[0]));
            if ($tag === '') {
                continue;
            }
            $q = 1.0;
            for ($i = 1, $count = count($subparts); $i < $count; $i++) {
                $param = trim($subparts[$i]);
                if (str_starts_with($param, 'q=')) {
                    $qVal = substr($param, 2);
                    if (is_numeric($qVal)) {
                        $q = (float)$qVal;
                    }
                }
            }
            $candidates[] = ['tag' => $tag, 'q' => $q, 'idx' => $index];
        }

        usort($candidates, static function (array $a, array $b): int {
            if ($a['q'] !== $b['q']) {
                return $b['q'] <=> $a['q'];
            }
            return $a['idx'] <=> $b['idx'];
        });

        foreach ($candidates as $candidate) {
            $primary = explode('-', $candidate['tag'])[0];
            if ($primary === 'ru') {
                return 'ru';
            }
            if ($primary === 'en') {
                return 'en';
            }
        }

        return 'en';
    }

    private function formatUserResponse(User $user, string $locale): array
    {
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

        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName() ?? $user->getEmail(),
            'picture' => $user->getAvatar(),
            'feature_flags' => $flags,
            'is_anonymous' => $user->isAnonymous(),
            'locale' => $locale,
            'created_at' => $user->getCreatedAt()->format('Y-m-d\TH:i:s'),
            'last_login_at' => (new \DateTimeImmutable())->format('Y-m-d\TH:i:s'),
            'last_board_interaction_at' => null,
            'stats' => null,
            'api_keys' => $apiKeysData,
        ];
    }

    #[Route('/api/v2/auth/dev-login', name: 'api_auth_dev_login', methods: ['POST'])]
    public function devLogin(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager,
        MercurePublisherService $mercurePublisher,
        JWTEncoderInterface $jwtEncoder,
        UserMigrationService $userMigrationService,
        RefreshTokenService $refreshTokenService
    ): JsonResponse {
        $devAuthRaw = isset($_ENV['DEV_AUTH']) ? (string)$_ENV['DEV_AUTH'] : (isset($_SERVER['DEV_AUTH']) ? (string)$_SERVER['DEV_AUTH'] : '');
        $devAuth = in_array(strtolower(trim($devAuthRaw)), ['true', '1', 'yes'], true);
        if (!$devAuth) {
            return new JsonResponse(['detail' => 'Dev login is disabled in this environment'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $email = !empty($data['email']) ? (string)$data['email'] : 'dev@local.user';
        $name = !empty($data['name']) ? (string)$data['name'] : 'Dev User';

        $prevUser = $this->resolveOptionalUser($request, $userRepository, $jwtEncoder, $entityManager);

        $user = $userRepository->findByEmail($email);
        $now = new \DateTimeImmutable();

        $adminEmailsEnv = isset($_ENV['ADMIN_EMAILS']) ? (string)$_ENV['ADMIN_EMAILS'] : (isset($_SERVER['ADMIN_EMAILS']) ? (string)$_SERVER['ADMIN_EMAILS'] : '');
        $adminEmailEnv = isset($_ENV['ADMIN_EMAIL']) ? (string)$_ENV['ADMIN_EMAIL'] : (isset($_SERVER['ADMIN_EMAIL']) ? (string)$_SERVER['ADMIN_EMAIL'] : '');
        $adminList = array_filter(array_map('trim', explode(',', strtolower($adminEmailsEnv . ',' . $adminEmailEnv))));
        $isAdmin = in_array(strtolower(trim($email)), $adminList, true) || in_array(strtolower(trim($email)), ['dkoldyaev@gmail.com', 'dev@local.user'], true);

        if ($user === null) {
            $user = new User(
                $email,
                $name,
                'https://api.dicebear.com/7.x/bottts/svg?seed=dev',
                $isAdmin,
                $isAdmin ? ['ROLE_USER', 'ROLE_ADMIN'] : ['ROLE_USER'],
                $now
            );
            $entityManager->persist($user);
            $entityManager->flush();
        } else {
            if ($user->getAvatar() === null) {
                $user->setAvatar('https://api.dicebear.com/7.x/bottts/svg?seed=dev');
            }
        }

        if ($prevUser !== null && $prevUser->isAnonymous() && $prevUser->getId() !== $user->getId()) {
            $userMigrationService->migrateAnonymousUserData($prevUser, $user);
        }

        $user->setLastLoginAt($now);
        $entityManager->flush();

        $locale = self::resolveAndPersistUserLocale($request, $entityManager, $user);
        $token = $jwtManager->create($user);
        $refreshToken = $refreshTokenService->createRefreshToken($user, $now);

        $response = new JsonResponse([
            'user' => $this->formatUserResponse($user, $locale),
            'token' => $token,
        ]);

        $response->headers->setCookie($refreshTokenService->createAccessTokenCookie($request, $token));
        $response->headers->setCookie($refreshTokenService->createRefreshTokenCookie($request, $refreshToken->getToken()));
        $response->headers->setCookie($mercurePublisher->createSubscriberCookie($request, (int)$user->getId()));

        return $response;
    }

    #[Route('/api/auth/me', name: 'api_auth_me_legacy', methods: ['GET'])]
    #[Route('/api/v2/auth/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(
        Request $request,
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager,
        JWTEncoderInterface $jwtEncoder,
        UserRepository $userRepository,
        MercurePublisherService $mercurePublisher,
        RefreshTokenService $refreshTokenService
    ): JsonResponse {
        $apiKeyHeader = $request->headers->get('X-API-Key') ?? $request->headers->get('x-api-key');
        $authHeader = $request->headers->get('Authorization');

        $isExplicitApiKey = ($apiKeyHeader !== null && trim((string)$apiKeyHeader) !== '')
            || ($authHeader !== null && str_starts_with((string)$authHeader, 'Bearer ak_'));

        $user = $this->resolveOptionalUser($request, $userRepository, $jwtEncoder, $entityManager);

        if ($isExplicitApiKey && $user === null) {
            return new JsonResponse(['detail' => 'Invalid API Key'], Response::HTTP_UNAUTHORIZED);
        }

        $now = new \DateTimeImmutable();
        $cookiesToSet = [];

        // 1. Silent renewal via refresh_token if access_token expired or missing
        if ($user === null && !$isExplicitApiKey) {
            $rawRefreshToken = $request->cookies->get('refresh_token');
            if ($rawRefreshToken !== null && trim((string)$rawRefreshToken) !== '') {
                $validRefreshToken = $refreshTokenService->findValidRefreshToken((string)$rawRefreshToken, $now);
                if ($validRefreshToken !== null) {
                    $user = $validRefreshToken->getUser();
                    $rotated = $refreshTokenService->rotateRefreshToken($validRefreshToken, $now);
                    $token = $jwtManager->create($user);
                    $cookiesToSet[] = $refreshTokenService->createAccessTokenCookie($request, $token);
                    $cookiesToSet[] = $refreshTokenService->createRefreshTokenCookie($request, $rotated->getToken());
                    $cookiesToSet[] = $mercurePublisher->createSubscriberCookie($request, (int)$user->getId());
                }
            }
        }

        // 2. If still unauthenticated, check if an expired access_token belonged to a permanent user
        if ($user === null && !$isExplicitApiKey) {
            $rawToken = null;
            if ($request->cookies->has('access_token')) {
                $rawToken = (string)$request->cookies->get('access_token');
            } elseif ($authHeader !== null && str_starts_with((string)$authHeader, 'Bearer ')) {
                $bearerVal = trim(substr((string)$authHeader, 7));
                if (!str_starts_with($bearerVal, 'ak_')) {
                    $rawToken = $bearerVal;
                }
            }

            if ($rawToken !== null && trim($rawToken) !== '') {
                $parts = explode('.', $rawToken);
                if (count($parts) === 3) {
                    $payloadJson = base64_decode(strtr($parts[1], '-_', '+/'));
                    $payload = json_decode($payloadJson, true);
                    if (is_array($payload)) {
                        $sub = $payload['sub'] ?? ($payload['email'] ?? null);
                        if ($sub !== null) {
                            $expiredUser = is_numeric($sub) ? $userRepository->find((int)$sub) : $userRepository->findByEmail((string)$sub);
                            if ($expiredUser !== null && !$expiredUser->isAnonymous()) {
                                // Permanent registered user session expired -> prompt login, do NOT convert to guest!
                                $response = new JsonResponse([
                                    'code' => 401,
                                    'message' => 'Session expired, please log in again',
                                    'detail' => 'Session expired',
                                ], Response::HTTP_UNAUTHORIZED);
                                $response->headers->clearCookie('access_token', '/');
                                $response->headers->setCookie($refreshTokenService->createClearRefreshCookie());
                                return $response;
                            }
                        }
                    }
                }
            }

            // 3. No token, or was an anonymous guest -> create fresh anonymous guest user
            $anonId = substr(bin2hex(random_bytes(6)), 0, 12);
            $user = new User(
                'guest_' . $anonId . '@guest.local',
                'Гость',
                'https://api.dicebear.com/7.x/bottts/svg?seed=guest_' . $anonId,
                false,
                ['ROLE_USER'],
                new \DateTimeImmutable()
            );
            $user->setIsAnonymous(true);
            $user->setLastLoginAt($now);
            $entityManager->persist($user);
            $entityManager->flush();

            $token = $jwtManager->create($user);
            $refreshToken = $refreshTokenService->createRefreshToken($user, $now);

            $cookiesToSet[] = $refreshTokenService->createAccessTokenCookie($request, $token);
            $cookiesToSet[] = $refreshTokenService->createRefreshTokenCookie($request, $refreshToken->getToken());
            $cookiesToSet[] = $mercurePublisher->createSubscriberCookie($request, (int)$user->getId());
        }

        $locale = self::resolveAndPersistUserLocale($request, $entityManager, $user);
        $response = new JsonResponse($this->formatUserResponse($user, $locale));
        foreach ($cookiesToSet as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }

    #[Route('/api/auth/refresh', name: 'api_auth_refresh_legacy', methods: ['POST'])]
    #[Route('/api/v2/auth/refresh', name: 'api_auth_refresh', methods: ['POST'])]
    public function refresh(
        Request $request,
        EntityManagerInterface $entityManager,
        RefreshTokenService $refreshTokenService,
        JWTTokenManagerInterface $jwtManager,
        MercurePublisherService $mercurePublisher
    ): JsonResponse {
        $rawRefreshToken = $request->cookies->get('refresh_token');
        if ($rawRefreshToken === null || trim((string)$rawRefreshToken) === '') {
            $data = json_decode($request->getContent(), true) ?? [];
            $rawRefreshToken = $data['refresh_token'] ?? null;
        }

        if ($rawRefreshToken === null || trim((string)$rawRefreshToken) === '') {
            return new JsonResponse(['detail' => 'Refresh token missing'], Response::HTTP_UNAUTHORIZED);
        }

        $now = new \DateTimeImmutable();
        $refreshToken = $refreshTokenService->findValidRefreshToken((string)$rawRefreshToken, $now);
        if ($refreshToken === null) {
            return new JsonResponse(['detail' => 'Invalid or expired refresh token'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $refreshToken->getUser();
        $locale = self::resolveAndPersistUserLocale($request, $entityManager, $user);
        $newRefreshToken = $refreshTokenService->rotateRefreshToken($refreshToken, $now);
        $token = $jwtManager->create($user);

        $response = new JsonResponse([
            'token' => $token,
            'user' => $this->formatUserResponse($user, $locale),
        ]);

        $response->headers->setCookie($refreshTokenService->createAccessTokenCookie($request, $token));
        $response->headers->setCookie($refreshTokenService->createRefreshTokenCookie($request, $newRefreshToken->getToken()));
        $response->headers->setCookie($mercurePublisher->createSubscriberCookie($request, (int)$user->getId()));

        return $response;
    }

    #[Route('/api/v2/auth/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function logout(
        Request $request,
        RefreshTokenService $refreshTokenService,
        MercurePublisherService $mercurePublisher
    ): JsonResponse {
        $rawRefreshToken = $request->cookies->get('refresh_token');
        if ($rawRefreshToken !== null && trim((string)$rawRefreshToken) !== '') {
            $refreshTokenService->revokeToken((string)$rawRefreshToken, new \DateTimeImmutable());
        }

        $response = new JsonResponse(['status' => 'ok']);
        $response->headers->clearCookie('access_token', '/');
        $response->headers->setCookie($refreshTokenService->createClearRefreshCookie());
        $response->headers->setCookie($mercurePublisher->createClearCookie());

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
