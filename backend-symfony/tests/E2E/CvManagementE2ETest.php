<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class CvManagementE2ETest extends ApiTestCase
{
    public function testCvLifecycleAndRescoringTrigger(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. GET initial CV
        $this->client->request('GET', '/api/v2/cv');
        $resGet1 = $this->client->getResponse();
        $this->assertSame(200, $resGet1->getStatusCode());
        $initialCv = $this->parseJsonResponse($resGet1);
        $this->assertArrayHasKey('content', $initialCv);
        $this->assertStringContainsString('Senior Software Engineer', $initialCv['content']);

        // 2. POST update CV -> triggers queue_updated and rescoring
        $newContent = 'Senior Fullstack Engineer with 10 years experience in Python and Symfony.';
        $this->client->request(
            'POST',
            '/api/v2/cv',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['content' => $newContent], JSON_UNESCAPED_UNICODE)
        );

        $resPost = $this->client->getResponse();
        $this->assertSame(200, $resPost->getStatusCode());

        // Assert Mercure queue_updated event
        $queueEvent = $this->assertMercureEvent('queue_updated');
        $this->assertIsArray($queueEvent);

        // Verify GET persistence
        $this->client->request('GET', '/api/v2/cv');
        $resGet2 = $this->client->getResponse();
        $this->assertSame(200, $resGet2->getStatusCode());
        $updatedCv = $this->parseJsonResponse($resGet2);
        $this->assertSame($newContent, $updatedCv['content']);

        // 3. DELETE CV
        $this->client->request('DELETE', '/api/v2/cv');
        $resDelete = $this->client->getResponse();
        $this->assertSame(204, $resDelete->getStatusCode());

        // Verify GET after delete returns null / empty content
        $this->client->request('GET', '/api/v2/cv');
        $resGet3 = $this->client->getResponse();
        $this->assertSame(200, $resGet3->getStatusCode());
        $emptyCv = json_decode((string) $resGet3->getContent(), true);
        $this->assertTrue($emptyCv === null || empty($emptyCv) || !isset($emptyCv['content']) || $emptyCv['content'] === null);
    }
}
