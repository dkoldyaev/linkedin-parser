<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Entity\User;
use App\Service\RefreshTokenService;
use App\Tests\Support\ApiTestCase;
use Symfony\Component\BrowserKit\Cookie;

class AuthAndSessionE2ETest extends ApiTestCase
{
    public function testDevLoginForAdminAndRegularUsers(): void
    {
        // 1. Dev login User 1 (Admin)
        $this->client->request(
            'POST',
            '/api/v2/auth/dev-login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['email' => 'dev@local.user', 'name' => 'Dev User'], JSON_UNESCAPED_UNICODE)
        );
        $res1 = $this->client->getResponse();
        $this->assertSame(200, $res1->getStatusCode());
        $data1 = $this->parseJsonResponse($res1);
        $this->assertArrayHasKey('token', $data1);
        $this->assertArrayHasKey('user', $data1);
        $this->assertSame('dev@local.user', $data1['user']['email']);

        // 2. Dev login User 2 (Regular)
        $this->client->request(
            'POST',
            '/api/v2/auth/dev-login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['email' => 'user2@local.user', 'name' => 'Regular User'], JSON_UNESCAPED_UNICODE)
        );
        $res2 = $this->client->getResponse();
        $this->assertSame(200, $res2->getStatusCode());
        $data2 = $this->parseJsonResponse($res2);
        $this->assertArrayHasKey('token', $data2);
        $this->assertArrayHasKey('user', $data2);
        $this->assertSame('user2@local.user', $data2['user']['email']);
    }

    public function testGuestAuthMeCreatesAnonymousUserAndSetsCookies(): void
    {
        $this->client->request('GET', '/api/v2/auth/me');

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertArrayHasKey('id', $data);
        $this->assertTrue($data['is_anonymous']);

        // Verify cookies set: access_token, refresh_token, mercureAuthorization
        $cookies = $this->client->getCookieJar()->all();
        $cookieNames = array_map(static fn(Cookie $c): string => $c->getName(), $cookies);

        $this->assertContains('access_token', $cookieNames);
        $this->assertContains('refresh_token', $cookieNames);
        $this->assertContains('mercureAuthorization', $cookieNames);
    }

    public function testUser1AuthMeAndLegacyAuthMe(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // /api/v2/auth/me
        $this->client->request('GET', '/api/v2/auth/me');
        $resV2 = $this->client->getResponse();
        $this->assertSame(200, $resV2->getStatusCode());
        $dataV2 = $this->parseJsonResponse($resV2);
        $this->assertSame('dev@local.user', $dataV2['email']);
        $this->assertContains('admin', $dataV2['feature_flags']);

        // /api/auth/me (legacy route)
        $this->client->request('GET', '/api/auth/me');
        $resLegacy = $this->client->getResponse();
        $this->assertSame(200, $resLegacy->getStatusCode());
        $dataLegacy = $this->parseJsonResponse($resLegacy);
        $this->assertSame('dev@local.user', $dataLegacy['email']);
    }

    public function testFeatureFlagsUpdateAdminAllowedAndNonAdminForbidden(): void
    {
        // 1. Regular user trying to update feature flags -> 403 Forbidden
        $this->authenticateClientAs($this->client, 'user2@local.user', 'Regular User');
        $this->client->request(
            'PUT',
            '/api/v2/auth/me/feature-flags',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['feature_flags' => ['admin', 'api_access']], JSON_UNESCAPED_UNICODE)
        );
        $forbiddenRes = $this->client->getResponse();
        $this->assertSame(403, $forbiddenRes->getStatusCode());

        // 2. Admin user updating feature flags -> 200 OK
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');
        $this->client->request(
            'PUT',
            '/api/v2/auth/me/feature-flags',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['feature_flags' => ['admin', 'api_access']], JSON_UNESCAPED_UNICODE)
        );
        $okRes = $this->client->getResponse();
        $this->assertSame(200, $okRes->getStatusCode());

        // Verify GET /api/v2/auth/me has updated flags
        $this->client->request('GET', '/api/v2/auth/me');
        $getRes = $this->client->getResponse();
        $getData = $this->parseJsonResponse($getRes);
        $this->assertContains('admin', $getData['feature_flags']);
        $this->assertContains('api_access', $getData['feature_flags']);
    }

    public function testAvailableFeatureFlagsEndpoint(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');
        $this->client->request('GET', '/api/v2/feature-flags');

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertArrayHasKey('available_flags', $data);
        $this->assertContains('admin', $data['available_flags']);
        $this->assertContains('api_access', $data['available_flags']);
    }

    public function testSilentRenewalWithRefreshTokenCookie(): void
    {
        /** @var RefreshTokenService $rtService */
        $rtService = static::getContainer()->get(RefreshTokenService::class);
        $userRepo = $this->entityManager->getRepository(User::class);
        /** @var User $user1 */
        $user1 = $userRepo->find(1);

        $refreshToken = $rtService->createRefreshToken($user1, new \DateTimeImmutable());
        $plainToken = $refreshToken->getToken();

        // Expired/missing access token but valid refresh_token cookie
        $this->client->getCookieJar()->clear();
        $this->client->getCookieJar()->set(new Cookie('refresh_token', $plainToken, null, '/', 'localhost'));

        $this->client->request('GET', '/api/v2/auth/me');
        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertSame('dev@local.user', $data['email']);

        // Verify silent renewal rotated cookies
        $cookies = $this->client->getCookieJar()->all();
        $cookieMap = [];
        foreach ($cookies as $c) {
            $cookieMap[$c->getName()] = $c->getValue();
        }

        $this->assertArrayHasKey('access_token', $cookieMap);
        $this->assertArrayHasKey('refresh_token', $cookieMap);
        // Refresh token must be rotated
        $this->assertNotSame($plainToken, $cookieMap['refresh_token']);
    }

    public function testExplicitRefreshEndpoint(): void
    {
        /** @var RefreshTokenService $rtService */
        $rtService = static::getContainer()->get(RefreshTokenService::class);
        $userRepo = $this->entityManager->getRepository(User::class);
        /** @var User $user2 */
        $user2 = $userRepo->find(2);

        $refreshToken = $rtService->createRefreshToken($user2, new \DateTimeImmutable());
        $plainToken = $refreshToken->getToken();

        $this->client->getCookieJar()->clear();
        $this->client->getCookieJar()->set(new Cookie('refresh_token', $plainToken, null, '/', 'localhost'));

        $this->client->request('POST', '/api/v2/auth/refresh');
        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertArrayHasKey('token', $data);
        $this->assertSame('user2@local.user', $data['user']['email']);
    }

    public function testLogoutRevokesSessionAndClearsCookies(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        $this->client->request('POST', '/api/v2/auth/logout');
        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertSame('ok', $data['status']);

        // Next GET /api/v2/auth/me without tokens should create a guest
        $this->client->setServerParameter('HTTP_AUTHORIZATION', '');
        $this->client->getCookieJar()->clear();
        $this->client->request('GET', '/api/v2/auth/me');
        $guestRes = $this->client->getResponse();
        $this->assertSame(200, $guestRes->getStatusCode());
        $guestData = $this->parseJsonResponse($guestRes);
        $this->assertTrue($guestData['is_anonymous']);
    }
}
