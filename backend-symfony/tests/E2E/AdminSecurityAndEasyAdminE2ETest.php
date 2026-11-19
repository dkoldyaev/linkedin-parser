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
}
