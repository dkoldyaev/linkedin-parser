<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class HealthAndConfigE2ETest extends ApiTestCase
{
    public function testHealthEndpoint(): void
    {
        $this->client->request('GET', '/api/health');

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertSame('ok', $data['status']);
    }

    public function testV2HealthEndpoint(): void
    {
        $this->client->request('GET', '/api/v2/health');

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertSame('ok', $data['status']);
    }

    public function testAuthConfigEndpoint(): void
    {
        $this->client->request('GET', '/api/auth/config');

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertArrayHasKey('google_configured', $data);
        $this->assertArrayHasKey('dev_mode', $data);
    }

    public function testV2AuthConfigEndpoint(): void
    {
        $this->client->request('GET', '/api/v2/auth/config');

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertArrayHasKey('google_configured', $data);
        $this->assertArrayHasKey('dev_mode', $data);
    }

    public function testExchangeRatesEndpoint(): void
    {
        $this->client->request('GET', '/api/v2/exchange-rates');

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $data = $this->parseJsonResponse($response);
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);
    }
}
