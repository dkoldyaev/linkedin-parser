<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class PublicApiV1E2ETest extends ApiTestCase
{
    public function testPublicApiKeyAuthenticationAndPermissionGates(): void
    {
        // 1. Request without API key -> 401 Unauthorized
        $this->client->request('GET', '/api/v1/vacancies');
        $resNoKey = $this->client->getResponse();
        $this->assertSame(401, $resNoKey->getStatusCode());

        // 2. User 2 has key "test_key_user2" but initially lacks "api_access" flag -> 403 Forbidden
        $this->authenticateClientWithApiKey($this->client, 'test_key_user2');
        $this->client->request('GET', '/api/v1/vacancies');
        $resForbidden = $this->client->getResponse();
        $this->assertSame(403, $resForbidden->getStatusCode());

        // 3. Admin grants "api_access" to User 2
        $this->client->setServerParameters([]);
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');
        $this->client->request(
            'PATCH',
            '/api/v2/admin/users/2',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['feature_flags' => ['api_access']], JSON_UNESCAPED_UNICODE)
        );
        $resGrant = $this->client->getResponse();
        $this->assertSame(200, $resGrant->getStatusCode());

        // 4. Now User 2 key works -> 200 OK
        $this->client->setServerParameters([]);
        $this->client->getCookieJar()->clear();
        $this->authenticateClientWithApiKey($this->client, 'test_key_user2');
        $this->client->request('GET', '/api/v1/vacancies');
        $resUser2Ok = $this->client->getResponse();
        $this->assertSame(200, $resUser2Ok->getStatusCode());
    }

    public function testPublicApiV1ReadEndpoints(): void
    {
        $this->authenticateClientWithApiKey($this->client, 'test_key_user1');

        // Vacancies list
        $this->client->request('GET', '/api/v1/vacancies');
        $resList = $this->client->getResponse();
        $this->assertSame(200, $resList->getStatusCode());
        $vacancies = $this->parseJsonResponse($resList);
        $this->assertIsArray($vacancies);
        $this->assertNotEmpty($vacancies);

        // Vacancy 1 detail
        $this->client->request('GET', '/api/v1/vacancies/1');
        $resDetail = $this->client->getResponse();
        $this->assertSame(200, $resDetail->getStatusCode());
        $detail = $this->parseJsonResponse($resDetail);
        $this->assertSame('Senior Backend Engineer', $detail['title']);

        // Vacancy 1 history
        $this->client->request('GET', '/api/v1/vacancies/1/history');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Vacancy 1 compatibility
        $this->client->request('GET', '/api/v1/vacancies/1/compatibility');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // CV
        $this->client->request('GET', '/api/v1/cv');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Columns
        $this->client->request('GET', '/api/v1/columns');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Tags
        $this->client->request('GET', '/api/v1/tags');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Cities
        $this->client->request('GET', '/api/v1/cities');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Countries
        $this->client->request('GET', '/api/v1/countries');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // Sources
        $this->client->request('GET', '/api/v1/sources');
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
    }

    public function testPublicApiV1CreateAndDeleteVacancy(): void
    {
        $this->authenticateClientWithApiKey($this->client, 'test_key_user1');

        // 1. POST /api/v1/vacancies
        $createPayload = [
            'title' => 'Public API Engineer',
            'company' => 'API Corp',
            'url' => 'https://example.com/jobs/v1_new',
            'status' => 'Еще не написал',
        ];

        $this->client->request(
            'POST',
            '/api/v1/vacancies',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($createPayload, JSON_UNESCAPED_UNICODE)
        );

        $resCreate = $this->client->getResponse();
        $this->assertSame(200, $resCreate->getStatusCode());
        $created = $this->parseJsonResponse($resCreate);
        $this->assertArrayHasKey('id', $created);
        $newId = (int) $created['id'];

        // Verify GET /api/v1/vacancies/{id}
        $this->client->request('GET', '/api/v1/vacancies/' . $newId);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        // 2. DELETE /api/v1/vacancies/{id}
        $this->client->request('DELETE', '/api/v1/vacancies/' . $newId);
        $resDelete = $this->client->getResponse();
        $this->assertSame(204, $resDelete->getStatusCode());

        // Assert Mercure vacancy_deleted event
        $deletedEvent = $this->assertMercureEvent('vacancy_deleted');
        $this->assertIsArray($deletedEvent);

        // Verify GET returns 404
        $this->client->request('GET', '/api/v1/vacancies/' . $newId);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());
    }
}
