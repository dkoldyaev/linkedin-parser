<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class AdminSecurityAndEasyAdminE2ETest extends ApiTestCase
{
    public function testAdminUsersApiPermissions(): void
    {
        // 1. Regular user accessing /api/v2/admin/users -> 403 Forbidden
        $this->authenticateClientAs($this->client, 'user2@local.user', 'Regular User');
        $this->client->request('GET', '/api/v2/admin/users');
        $resForbidden = $this->client->getResponse();
        $this->assertSame(403, $resForbidden->getStatusCode());

        // 2. Admin user accessing /api/v2/admin/users -> 200 OK
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');
        $this->client->request('GET', '/api/v2/admin/users');
        $resAdmin = $this->client->getResponse();
        $this->assertSame(200, $resAdmin->getStatusCode());
        $usersData = $this->parseJsonResponse($resAdmin);
        $this->assertIsArray($usersData);
        $this->assertNotEmpty($usersData);

        // 3. Admin user updating feature flags of User 2 -> 200 OK
        $patchPayload = ['feature_flags' => ['api_access']];
        $this->client->request(
            'PATCH',
            '/api/v2/admin/users/2',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($patchPayload, JSON_UNESCAPED_UNICODE)
        );
        $resPatch = $this->client->getResponse();
        $this->assertSame(200, $resPatch->getStatusCode());
    }

    public function testEasyAdminSecurityAndRoutes(): void
    {
        // 1. Regular user accessing /admin -> 403 or 302 Redirect to /admin/login
        $this->authenticateClientAs($this->client, 'user2@local.user', 'Regular User');
        $this->client->request('GET', '/admin');
        $resUser2 = $this->client->getResponse();
        $this->assertTrue(in_array($resUser2->getStatusCode(), [403, 302], true));
        if ($resUser2->getStatusCode() === 302) {
            $this->assertStringContainsString('/admin/login', (string) $resUser2->headers->get('Location'));
        }

        // 2. Admin user accessing /admin -> 200 OK (or redirect to dashboard)
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');
        $this->client->request('GET', '/admin');
        $resAdmin = $this->client->getResponse();
        $this->assertTrue(in_array($resAdmin->getStatusCode(), [200, 302], true));

        // 3. Admin accessing EasyAdmin entity routes
        $this->client->request('GET', '/admin/vacancy');
        $this->assertTrue(in_array($this->client->getResponse()->getStatusCode(), [200, 302], true));

        $this->client->request('GET', '/admin/user');
        $this->assertTrue(in_array($this->client->getResponse()->getStatusCode(), [200, 302], true));

        $this->client->request('GET', '/admin/processing-queue-item');
        $this->assertTrue(in_array($this->client->getResponse()->getStatusCode(), [200, 302], true));
    }

    public function testAdminLoginCsrfProtection(): void
    {
        $this->client->setServerParameters(['REMOTE_ADDR' => '192.168.100.1']);
        $this->client->getCookieJar()->clear();

        // 1. GET /admin/login returns 200 and renders CSRF hidden input
        $crawler = $this->client->request('GET', '/admin/login');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $csrfInput = $crawler->filter('input[name="_csrf_token"]');
        $this->assertGreaterThan(0, $csrfInput->count());
        $csrfToken = $csrfInput->attr('value');
        $this->assertNotEmpty($csrfToken);

        // 2. POST without valid CSRF token fails
        $this->client->request('POST', '/admin/login', [
            'email' => 'dev@local.user',
            'password' => 'AdminSecure2026!',
            '_csrf_token' => 'invalid_csrf_token',
        ]);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $this->assertStringContainsString('Недействительный токен CSRF', (string)$this->client->getResponse()->getContent());

        // 3. POST with valid CSRF token succeeds and redirects to /admin with access_token cookie
        $this->client->request('POST', '/admin/login', [
            'email' => 'dev@local.user',
            'password' => 'AdminSecure2026!',
            '_csrf_token' => $csrfToken,
        ]);
        $this->assertSame(302, $this->client->getResponse()->getStatusCode(), 'Login failed: ' . $this->client->getResponse()->getContent());
        $this->assertSame('/admin', $this->client->getResponse()->headers->get('Location'));
        $cookie = $this->client->getCookieJar()->get('access_token');
        $this->assertNotNull($cookie);

        // 4. Rate limiting: excess attempts from a specific IP trigger throttling error
        $this->client->setServerParameters(['REMOTE_ADDR' => '192.168.100.2']);
        for ($i = 0; $i < 12; $i++) {
            $this->client->request('POST', '/admin/login', [
                'email' => 'dev@local.user',
                'password' => 'WrongPassword!',
                '_csrf_token' => $csrfToken,
            ]);
        }
        $resRateLimited = $this->client->getResponse();
        $this->assertSame(200, $resRateLimited->getStatusCode());
        $this->assertStringContainsString('Слишком много попыток входа', (string)$resRateLimited->getContent());
    }

    public function testAdminMercureRealtimeEventsAndCookieAuthorization(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. Visiting /admin sets mercureAuthorization cookie granting subscription to admin:events
        $this->client->request('GET', '/admin');
        $cookie = $this->client->getCookieJar()->get('mercureAuthorization', '/.well-known/mercure');
        $this->assertNotNull($cookie, 'Admin visiting /admin must receive mercureAuthorization cookie.');

        $tokenParts = explode('.', $cookie->getValue());
        $this->assertCount(3, $tokenParts);
        $payload = json_decode((string) base64_decode(strtr($tokenParts[1], '-_', '+/')), true);
        $this->assertIsArray($payload);
        $this->assertArrayHasKey('mercure', $payload);
        $subscribeGrants = $payload['mercure']['subscribe'] ?? [];
        $this->assertContains(\App\Service\Mercure\MercurePublisherService::ADMIN_TOPIC, $subscribeGrants);

        // 2. Doctrine event for Vacancy -> published to admin:events
        $em = static::getContainer()->get('doctrine.orm.entity_manager');
        $user = $em->getRepository(\App\Entity\User::class)->findOneBy(['email' => 'dev@local.user']);
        $this->assertNotNull($user);

        $now = new \DateTimeImmutable();
        $vacancy = new \App\Entity\Vacancy();
        $vacancy->setUrl('https://www.linkedin.com/jobs/view/777888999');
        $vacancy->setTitle('Staff Engineer Realtime');
        $vacancy->setCompany('Antigravity');
        $vacancy->setStatus(\App\Entity\Vacancy::STATUS_NOT_CONTACTED);
        $vacancy->setIsClosed(false);
        $vacancy->setLane(0);
        $vacancy->setTechStack(['PHP', 'Symfony', 'Mercure']);
        $vacancy->setTags([]);
        $vacancy->setUser($user);
        $vacancy->setCreatedAt($now);
        $vacancy->setUpdatedAt($now);

        $em->persist($vacancy);
        $em->flush();

        $vacancyCreatedEvent = $this->assertMercureAdminEvent(\App\Service\Mercure\MercurePublisherService::EVENT_VACANCY_CREATED);
        $this->assertSame('vacancy', $vacancyCreatedEvent['data']['entity'] ?? null);
        $this->assertSame('created', $vacancyCreatedEvent['data']['action'] ?? null);
        $this->assertSame('Staff Engineer Realtime', $vacancyCreatedEvent['data']['title'] ?? null);

        // 3. Updating Vacancy status -> published to admin:events
        $vacancy->setStatus(\App\Entity\Vacancy::STATUS_CONTACTED);
        $em->flush();

        $vacancyUpdatedEvent = $this->assertMercureAdminEvent(\App\Service\Mercure\MercurePublisherService::EVENT_VACANCY_UPDATED);
        $this->assertSame('vacancy', $vacancyUpdatedEvent['data']['entity'] ?? null);
        $this->assertSame('updated', $vacancyUpdatedEvent['data']['action'] ?? null);
        $this->assertSame(\App\Entity\Vacancy::STATUS_CONTACTED, $vacancyUpdatedEvent['data']['status'] ?? null);

        // 4. Doctrine event for ProcessingQueueItem -> published to admin:events
        $queueItem = new \App\Entity\ProcessingQueueItem(
            'task-test-realtime-admin',
            'https://www.linkedin.com/jobs/view/777888999',
            'pending',
            'queued',
            0,
            $now
        );
        $queueItem->setUser($user);
        $queueItem->setVacancyId($vacancy->getId());
        $em->persist($queueItem);
        $em->flush();

        $queueCreatedEvent = $this->assertMercureAdminEvent(\App\Service\Mercure\MercurePublisherService::EVENT_QUEUE_UPDATED);
        $this->assertSame('queue', $queueCreatedEvent['data']['entity'] ?? null);
        $this->assertSame('task-test-realtime-admin', $queueCreatedEvent['data']['task_id'] ?? null);

        // 5. Doctrine event for UserLLMTokenUsage -> published to admin:events
        $tokenUsage = new \App\Entity\UserLLMTokenUsage(
            $user,
            'gemini',
            'gemini-2.0-flash',
            100,
            50,
            150,
            $now
        );
        $em->persist($tokenUsage);
        $em->flush();

        $tokenEvent = $this->assertMercureAdminEvent(\App\Service\Mercure\MercurePublisherService::EVENT_TOKEN_USAGE_CREATED);
        $this->assertSame('token_usage', $tokenEvent['data']['entity'] ?? null);
        $this->assertSame('gemini', $tokenEvent['data']['provider'] ?? null);
        $this->assertSame(150, $tokenEvent['data']['total_tokens'] ?? null);

        // 6. Doctrine event for Vacancy deletion -> published to admin:events
        $vacancyId = $vacancy->getId();
        $em->remove($vacancy);
        $em->flush();

        $vacancyDeletedEvent = $this->assertMercureAdminEvent(\App\Service\Mercure\MercurePublisherService::EVENT_VACANCY_DELETED);
        $this->assertSame('vacancy', $vacancyDeletedEvent['data']['entity'] ?? null);
        $this->assertSame('deleted', $vacancyDeletedEvent['data']['action'] ?? null);
        $this->assertSame($vacancyId, $vacancyDeletedEvent['data']['id'] ?? null);
    }
}
