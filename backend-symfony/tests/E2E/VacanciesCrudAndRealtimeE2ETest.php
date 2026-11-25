<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class VacanciesCrudAndRealtimeE2ETest extends ApiTestCase
{
    public function testListVacanciesAndTenantIsolation(): void
    {
        // 1. User 1 vacancies
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');
        $this->client->request('GET', '/api/v2/vacancies');

        $res1 = $this->client->getResponse();
        $this->assertSame(200, $res1->getStatusCode());
        $data1 = $this->parseJsonResponse($res1);

        $items1 = isset($data1['items']) ? $data1['items'] : $data1;
        $this->assertIsArray($items1);
        $this->assertCount(6, $items1);
        $firstItem = $items1[0];
        $this->assertArrayHasKey('title', $firstItem);
        $this->assertArrayHasKey('ai_summary', $firstItem);
        $this->assertArrayNotHasKey('description', $firstItem);
        $this->assertArrayNotHasKey('company_info', $firstItem);
        $this->assertArrayNotHasKey('notes', $firstItem);
        $this->assertArrayNotHasKey('history', $firstItem);

        // 2. User 2 vacancies (tenant isolation)
        $this->authenticateClientAs($this->client, 'user2@local.user', 'Regular User');
        $this->client->request('GET', '/api/v2/vacancies');

        $res2 = $this->client->getResponse();
        $this->assertSame(200, $res2->getStatusCode());
        $data2 = $this->parseJsonResponse($res2);

        $items2 = isset($data2['items']) ? $data2['items'] : $data2;
        $this->assertIsArray($items2);
        $this->assertCount(2, $items2);
    }

    public function testGetVacancyByIdAndCrossTenantIsolation(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // Own vacancy 1 -> 200
        $this->client->request('GET', '/api/v2/vacancies/1');
        $res1 = $this->client->getResponse();
        $this->assertSame(200, $res1->getStatusCode());
        $data1 = $this->parseJsonResponse($res1);
        $this->assertSame('Senior Backend Engineer', $data1['title']);
        $this->assertArrayHasKey('description', $data1);
        $this->assertArrayHasKey('company_info', $data1);
        $this->assertArrayHasKey('notes', $data1);
        $this->assertArrayHasKey('history', $data1);

        // Cross-tenant vacancy 101 belonging to User 2 -> 404
        $this->client->request('GET', '/api/v2/vacancies/101');
        $res101 = $this->client->getResponse();
        $this->assertSame(404, $res101->getStatusCode());
    }

    public function testFullVacancyLifecycleRealtimeAndRescoring(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. CREATE vacancy
        $createPayload = [
            'title' => 'Rust Systems Architect',
            'company' => 'Mozilla',
            'url' => 'https://example.com/jobs/99',
            'status' => 'Еще не написал',
            'location' => 'Berlin, Germany',
            'workplace_type' => 'remote',
            'is_closed' => false,
            'salary_min' => 7000.0,
            'salary_max' => 9500.0,
            'salary_currency' => 'EUR',
            'salary_period' => 'month',
            'tech_stack' => ['Rust', 'Wasm', 'Tokio'],
            'tags' => ['systems'],
            'lane' => 0,
        ];

        $this->client->request(
            'POST',
            '/api/v2/vacancies',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($createPayload, JSON_UNESCAPED_UNICODE)
        );

        $createRes = $this->client->getResponse();
        $this->assertSame(200, $createRes->getStatusCode());
        $createdData = $this->parseJsonResponse($createRes);
        $this->assertArrayHasKey('id', $createdData);
        $newId = (int) $createdData['id'];

        // Assert Mercure vacancy_created event
        $createdEvent = $this->assertMercureEvent('vacancy_created');
        $this->assertIsArray($createdEvent);

        // Verify GET persistence
        $this->client->request('GET', '/api/v2/vacancies/' . $newId);
        $getRes = $this->client->getResponse();
        $this->assertSame(200, $getRes->getStatusCode());
        $getData = $this->parseJsonResponse($getRes);
        $this->assertSame('Rust Systems Architect', $getData['title']);

        // 2. PATCH status, notes, workplace_type, is_closed
        $patchPayload = [
            'status' => 'Собеседование',
            'notes' => 'Updated by E2E test',
            'workplace_type' => 'remote',
            'is_closed' => true,
        ];

        $this->client->request(
            'PATCH',
            '/api/v2/vacancies/' . $newId,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($patchPayload, JSON_UNESCAPED_UNICODE)
        );

        $patchRes = $this->client->getResponse();
        $this->assertSame(200, $patchRes->getStatusCode());

        // Assert Mercure vacancy_updated event
        $updatedEvent = $this->assertMercureEvent('vacancy_updated');
        $this->assertIsArray($updatedEvent);

        // Verify GET persistence
        $this->client->request('GET', '/api/v2/vacancies/' . $newId);
        $getPatchedRes = $this->client->getResponse();
        $getPatchedData = $this->parseJsonResponse($getPatchedRes);
        $this->assertSame('Собеседование', $getPatchedData['status']);
        $this->assertSame('Updated by E2E test', $getPatchedData['notes']);
        $this->assertTrue($getPatchedData['is_closed']);

        // 3. PATCH description ("исходный текст") -> triggers rescoring and queue_updated event
        $descPayload = [
            'description' => 'Updated vacancy requirements: 5+ years of PHP, Symfony, Docker, Mercure real-time event streaming.',
        ];

        $this->client->request(
            'PATCH',
            '/api/v2/vacancies/' . $newId,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($descPayload, JSON_UNESCAPED_UNICODE)
        );

        $descRes = $this->client->getResponse();
        $this->assertSame(200, $descRes->getStatusCode());

        // Assert Mercure queue_updated event triggered by rescoring
        $queueEvent = $this->assertMercureEvent('queue_updated');
        $this->assertIsArray($queueEvent);

        // 4. POST Reorder vacancies
        $reorderPayload = [
            'status' => 'Собеседование',
            'ids' => [3, $newId],
            'lane' => 0,
            'moved_id' => $newId,
        ];

        $this->mercureHub->clear();
        $this->client->request(
            'POST',
            '/api/v2/vacancies/reorder',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($reorderPayload, JSON_UNESCAPED_UNICODE)
        );

        $reorderRes = $this->client->getResponse();
        $this->assertSame(200, $reorderRes->getStatusCode());

        // Verify that only the moved vacancy emitted vacancy_updated
        $updates = $this->mercureHub->getPublishedUpdates();
        $userVacancyUpdatedEvents = array_values(array_filter($updates, static fn($u) => str_starts_with($u['topics'][0] ?? '', 'vacancies:') && ($u['data']['type'] ?? null) === 'vacancy_updated'));
        $this->assertCount(1, $userVacancyUpdatedEvents, 'Only the moved vacancy should emit a vacancy_updated event.');
        $this->assertSame($newId, $userVacancyUpdatedEvents[0]['data']['vacancy_id'] ?? null);

        // Verify that dragging a card and returning it to its place emits ZERO events
        $this->mercureHub->clear();
        $this->client->request(
            'POST',
            '/api/v2/vacancies/reorder',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($reorderPayload, JSON_UNESCAPED_UNICODE)
        );
        $this->assertSame(200, $this->client->getResponse()->getStatusCode());
        $this->assertCount(0, $this->mercureHub->getPublishedUpdates(), 'Returning card to its place must not emit any Mercure events.');

        // Verify GET sort_order
        $this->client->request('GET', '/api/v2/vacancies/' . $newId);
        $reorderedData = $this->parseJsonResponse($this->client->getResponse());
        $this->assertEquals(1.0, (float) $reorderedData['sort_order']);

        // 5. POST Resummarize
        $this->client->request('POST', '/api/v2/vacancies/' . $newId . '/resummarize');
        $resummarizeRes = $this->client->getResponse();
        $this->assertSame(200, $resummarizeRes->getStatusCode());

        // 6. DELETE Vacancy -> 204 & Mercure vacancy_deleted
        $this->client->request('DELETE', '/api/v2/vacancies/' . $newId);
        $deleteRes = $this->client->getResponse();
        $this->assertSame(204, $deleteRes->getStatusCode());

        // Assert Mercure vacancy_deleted
        $deletedEvent = $this->assertMercureEvent('vacancy_deleted');
        $this->assertIsArray($deletedEvent);

        // Verify GET returns 404
        $this->client->request('GET', '/api/v2/vacancies/' . $newId);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());
    }
}
