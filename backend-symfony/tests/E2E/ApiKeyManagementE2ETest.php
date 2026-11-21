<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class ApiKeyManagementE2ETest extends ApiTestCase
{
    public function testApiKeyLifecycle(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. GET initial keys
        $this->client->request('GET', '/api/v2/api-keys');
        $resGet1 = $this->client->getResponse();
        $this->assertSame(200, $resGet1->getStatusCode());
        $initialKeys = $this->parseJsonResponse($resGet1);
        $this->assertIsArray($initialKeys);
        $this->assertNotEmpty($initialKeys);

        // 2. POST create new API key
        $this->client->request(
            'POST',
            '/api/v2/api-keys',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['name' => 'Shadow Test Key'], JSON_UNESCAPED_UNICODE)
        );

        $resPost = $this->client->getResponse();
        $this->assertSame(200, $resPost->getStatusCode());
        $createdKey = $this->parseJsonResponse($resPost);
        $this->assertArrayHasKey('id', $createdKey);
        $this->assertArrayHasKey('token', $createdKey);
        $this->assertSame('Shadow Test Key', $createdKey['name']);
        $newKeyId = (int) $createdKey['id'];

        // Verify key has prefix 'ak_'
        $prefix = $createdKey['key_prefix'] ?? $createdKey['prefix'] ?? '';
        $this->assertStringStartsWith('ak_', $prefix);

        // Verify GET persistence
        $this->client->request('GET', '/api/v2/api-keys');
        $resGet2 = $this->client->getResponse();
        $this->assertSame(200, $resGet2->getStatusCode());
        $afterKeys = $this->parseJsonResponse($resGet2);

        $found = false;
        foreach ($afterKeys as $k) {
            if ((int) $k['id'] === $newKeyId) {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, 'Created API key not found in API keys list');

        // 3. DELETE API key
        $this->client->request('DELETE', '/api/v2/api-keys/' . $newKeyId);
        $resDelete = $this->client->getResponse();
        $this->assertSame(200, $resDelete->getStatusCode());

        // Verify GET no longer has deleted key
        $this->client->request('GET', '/api/v2/api-keys');
        $resGet3 = $this->client->getResponse();
        $afterDeleteKeys = $this->parseJsonResponse($resGet3);

        $stillPresent = false;
        foreach ($afterDeleteKeys as $k) {
            if ((int) $k['id'] === $newKeyId) {
                $stillPresent = true;
                break;
            }
        }
        $this->assertFalse($stillPresent, 'Deleted API key still present');
    }
}
