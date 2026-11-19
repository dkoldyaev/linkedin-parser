<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class ScoringAndCompatibilityE2ETest extends ApiTestCase
{
    public function testGetAndTriggerCompatibility(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. GET compatibility (empty before analysis is run)
        $this->client->request('GET', '/api/v2/vacancies/1/compatibility');
        $resGet = $this->client->getResponse();
        $this->assertSame(200, $resGet->getStatusCode());
        $compatData = json_decode((string) $resGet->getContent(), true);
        $this->assertEmpty($compatData);

        // 2. POST compatibility analysis -> triggers queue_updated
        $this->client->request('POST', '/api/v2/vacancies/1/compatibility');
        $resPost = $this->client->getResponse();
        $this->assertSame(200, $resPost->getStatusCode());

        // Assert Mercure queue_updated event
        $queueEvent = $this->assertMercureEvent('queue_updated');
        $this->assertIsArray($queueEvent);
    }

    public function testAdaptCvEndpointReturnsForbiddenWithoutSubscription(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        $this->client->request('POST', '/api/v2/vacancies/1/adapt-cv');
        $res = $this->client->getResponse();
        $this->assertSame(403, $res->getStatusCode());
    }
}
