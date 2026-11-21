<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class KanbanColumnsAndMetadataE2ETest extends ApiTestCase
{
    public function testColumnsCrudLifecycle(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. GET initial columns
        $this->client->request('GET', '/api/v2/columns');
        $res1 = $this->client->getResponse();
        $this->assertSame(200, $res1->getStatusCode());
        $initialCols = $this->parseJsonResponse($res1);
        $this->assertIsArray($initialCols);
        $this->assertNotEmpty($initialCols);

        // 2. POST create custom column "Archive"
        $createPayload = [
            'name' => 'Archive',
            'color' => '#64748b',
            'has_lanes' => false,
        ];
        $this->client->request(
            'POST',
            '/api/v2/columns',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($createPayload, JSON_UNESCAPED_UNICODE)
        );

        $resPost = $this->client->getResponse();
        $this->assertSame(200, $resPost->getStatusCode());

        // Verify GET has "Archive"
        $this->client->request('GET', '/api/v2/columns');
        $afterCreate = $this->parseJsonResponse($this->client->getResponse());
        $foundCreated = false;
        foreach ($afterCreate as $col) {
            $colId = $col['id'] ?? $col['name'] ?? null;
            if ($colId === 'Archive' && $col['color'] === '#64748b') {
                $foundCreated = true;
                break;
            }
        }
        $this->assertTrue($foundCreated, 'Created column "Archive" not found');

        // 3. PATCH column color
        $patchPayload = ['color' => '#334155'];
        $this->client->request(
            'PATCH',
            '/api/v2/columns/Archive',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($patchPayload, JSON_UNESCAPED_UNICODE)
        );

        $resPatch = $this->client->getResponse();
        $this->assertSame(200, $resPatch->getStatusCode());

        // Verify GET has updated color
        $this->client->request('GET', '/api/v2/columns');
        $afterPatch = $this->parseJsonResponse($this->client->getResponse());
        $foundPatched = false;
        foreach ($afterPatch as $col) {
            $colId = $col['id'] ?? $col['name'] ?? null;
            if ($colId === 'Archive' && $col['color'] === '#334155') {
                $foundPatched = true;
                break;
            }
        }
        $this->assertTrue($foundPatched, 'Patched column color not found');

        // 4. DELETE column
        $this->client->request('DELETE', '/api/v2/columns/Archive');
        $resDelete = $this->client->getResponse();
        $this->assertSame(200, $resDelete->getStatusCode());

        // Verify GET no longer has "Archive"
        $this->client->request('GET', '/api/v2/columns');
        $afterDelete = $this->parseJsonResponse($this->client->getResponse());
        $stillExists = false;
        foreach ($afterDelete as $col) {
            $colId = $col['id'] ?? $col['name'] ?? null;
            if ($colId === 'Archive') {
                $stillExists = true;
                break;
            }
        }
        $this->assertFalse($stillExists, 'Deleted column "Archive" still present');
    }

    public function testUserSettingsLifecycle(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. GET settings
        $this->client->request('GET', '/api/v2/settings');
        $resGet = $this->client->getResponse();
        $this->assertSame(200, $resGet->getStatusCode());
        $initialSettings = $this->parseJsonResponse($resGet);
        $this->assertArrayHasKey('locale', $initialSettings);

        // 2. POST update settings
        $settingsPayload = [
            'locale' => 'en',
            'salary_display_format' => 'year',
        ];
        $this->client->request(
            'POST',
            '/api/v2/settings',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($settingsPayload, JSON_UNESCAPED_UNICODE)
        );

        $resPost = $this->client->getResponse();
        $this->assertSame(200, $resPost->getStatusCode());

        // Verify GET settings has new values
        $this->client->request('GET', '/api/v2/settings');
        $afterSettings = $this->parseJsonResponse($this->client->getResponse());
        $this->assertSame('en', $afterSettings['locale']);
        $this->assertSame('year', $afterSettings['salary_display_format']);
    }

    public function testAggregatedMetadataEndpoints(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // Stats
        $this->client->request('GET', '/api/v2/stats');
        $resStats = $this->client->getResponse();
        $this->assertSame(200, $resStats->getStatusCode());
        $stats = $this->parseJsonResponse($resStats);
        $this->assertArrayHasKey('total', $stats);
        $this->assertGreaterThan(0, $stats['total']);

        // Tags
        $this->client->request('GET', '/api/v2/tags');
        $resTags = $this->client->getResponse();
        $this->assertSame(200, $resTags->getStatusCode());
        $tags = $this->parseJsonResponse($resTags);
        $this->assertIsArray($tags);

        // Cities
        $this->client->request('GET', '/api/v2/cities');
        $resCities = $this->client->getResponse();
        $this->assertSame(200, $resCities->getStatusCode());
        $cities = $this->parseJsonResponse($resCities);
        $this->assertIsArray($cities);

        // Countries
        $this->client->request('GET', '/api/v2/countries');
        $resCountries = $this->client->getResponse();
        $this->assertSame(200, $resCountries->getStatusCode());
        $countries = $this->parseJsonResponse($resCountries);
        $this->assertIsArray($countries);

        // Sources
        $this->client->request('GET', '/api/v2/sources');
        $resSources = $this->client->getResponse();
        $this->assertSame(200, $resSources->getStatusCode());
        $sources = $this->parseJsonResponse($resSources);
        $this->assertIsArray($sources);
    }
}
