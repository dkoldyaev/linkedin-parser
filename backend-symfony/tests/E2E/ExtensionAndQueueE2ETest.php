<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class ExtensionAndQueueE2ETest extends ApiTestCase
{
    public function testExtensionEndpoints(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. POST ping
        $this->client->request('POST', '/api/v2/extension/ping');
        $resPing = $this->client->getResponse();
        $this->assertSame(200, $resPing->getStatusCode());
        $dataPing = $this->parseJsonResponse($resPing);
        $this->assertSame('ok', $dataPing['status'] ?? $dataPing['message'] ?? 'ok');

        // 2. GET status
        $this->client->request('GET', '/api/v2/extension/status');
        $resStatus = $this->client->getResponse();
        $this->assertSame(200, $resStatus->getStatusCode());

        // 3. GET changelog (public endpoint)
        $this->client->request('GET', '/api/v2/extension/changelog');
        $resChangelog = $this->client->getResponse();
        $this->assertSame(200, $resChangelog->getStatusCode());

        // 4. GET mercure_config
        $this->client->request('GET', '/api/v2/extension/mercure_config');
        $resMercure = $this->client->getResponse();
        $this->assertSame(200, $resMercure->getStatusCode());

        // 5. GET tasks
        $this->client->request('GET', '/api/v2/extension/tasks');
        $resTasks = $this->client->getResponse();
        $this->assertSame(200, $resTasks->getStatusCode());

        // 6. POST log
        $this->client->request(
            'POST',
            '/api/v2/extension/log',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['level' => 'info', 'message' => 'Extension test log'], JSON_UNESCAPED_UNICODE)
        );
        $resLog = $this->client->getResponse();
        $this->assertSame(200, $resLog->getStatusCode());
    }

    public function testBatchVacancyImportAndQueueLifecycle(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. GET initial queue
        $this->client->request('GET', '/api/v2/queue/links');
        $resQueue1 = $this->client->getResponse();
        $this->assertSame(200, $resQueue1->getStatusCode());

        // 2. POST /api/v2/vacancies/batch -> triggers queue_updated Mercure event
        $batchPayload = [
            'urls' => ['https://www.linkedin.com/jobs/view/999888777/'],
        ];
        $this->client->request(
            'POST',
            '/api/v2/vacancies/batch',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($batchPayload, JSON_UNESCAPED_UNICODE)
        );

        $resBatch = $this->client->getResponse();
        $this->assertSame(200, $resBatch->getStatusCode());
        $batchData = $this->parseJsonResponse($resBatch);
        $this->assertArrayHasKey('queued', $batchData);

        // Assert Mercure queue_updated event
        $queueEvent1 = $this->assertMercureEvent('queue_updated');
        $this->assertIsArray($queueEvent1);

        // Verify GET /api/v2/queue/links has items
        $this->client->request('GET', '/api/v2/queue/links');
        $resQueue2 = $this->client->getResponse();
        $this->assertSame(200, $resQueue2->getStatusCode());
        $linksData = $this->parseJsonResponse($resQueue2);
        $linksList = isset($linksData['links']) ? $linksData['links'] : $linksData;
        $this->assertIsArray($linksList);
        $this->assertNotEmpty($linksList);

        // 3. DELETE /api/v2/queue/clear -> triggers queue_updated Mercure event
        $this->client->request('DELETE', '/api/v2/queue/clear');
        $resClear = $this->client->getResponse();
        $this->assertSame(200, $resClear->getStatusCode());

        // Assert Mercure queue_updated event
        $queueEvent2 = $this->assertMercureEvent('queue_updated');
        $this->assertIsArray($queueEvent2);

        // Verify GET /api/v2/queue/links is now empty
        $this->client->request('GET', '/api/v2/queue/links');
        $resQueue3 = $this->client->getResponse();
        $this->assertSame(200, $resQueue3->getStatusCode());
        $emptyLinksData = $this->parseJsonResponse($resQueue3);
        $emptyList = isset($emptyLinksData['links']) ? $emptyLinksData['links'] : $emptyLinksData;
        $this->assertEmpty($emptyList);
    }
}
