<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Tests\Support\ApiTestCase;

class VacancyHistoryAndCommentsE2ETest extends ApiTestCase
{
    public function testVacancyHistoryLifecycle(): void
    {
        $this->authenticateClientAs($this->client, 'dev@local.user', 'Dev User');

        // 1. GET history of vacancy 2
        $this->client->request('GET', '/api/v2/vacancies/2/history');
        $resGet1 = $this->client->getResponse();
        $this->assertSame(200, $resGet1->getStatusCode());
        $historyData1 = $this->parseJsonResponse($resGet1);
        $items1 = isset($historyData1['history']) ? $historyData1['history'] : $historyData1;
        $this->assertIsArray($items1);
        $this->assertNotEmpty($items1);

        // 2. POST add history entry
        $postPayload = [
            'to_status' => 'Собеседование',
            'to_lane' => 0,
            'comment' => 'HR screening scheduled',
        ];
        $this->client->request(
            'POST',
            '/api/v2/vacancies/2/history',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($postPayload, JSON_UNESCAPED_UNICODE)
        );

        $resPost = $this->client->getResponse();
        $this->assertSame(200, $resPost->getStatusCode());
        $postData = $this->parseJsonResponse($resPost);

        $postList = isset($postData['history']) ? $postData['history'] : $postData;
        $this->assertIsArray($postList);
        $lastItem = end($postList);
        $this->assertIsArray($lastItem);
        $this->assertArrayHasKey('id', $lastItem);
        $newHistoryId = (int) $lastItem['id'];

        // 3. PATCH update history comment
        $patchPayload = [
            'comment' => 'Updated screening time',
        ];
        $this->client->request(
            'PATCH',
            '/api/v2/vacancies/2/history/' . $newHistoryId,
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode($patchPayload, JSON_UNESCAPED_UNICODE)
        );

        $resPatch = $this->client->getResponse();
        $this->assertSame(200, $resPatch->getStatusCode());

        // Assert Mercure vacancy_updated event
        $updatedEvent = $this->assertMercureEvent('vacancy_updated');
        $this->assertIsArray($updatedEvent);

        // Verify GET persistence
        $this->client->request('GET', '/api/v2/vacancies/2/history');
        $resGet2 = $this->client->getResponse();
        $this->assertSame(200, $resGet2->getStatusCode());
        $historyData2 = $this->parseJsonResponse($resGet2);
        $items2 = isset($historyData2['history']) ? $historyData2['history'] : $historyData2;

        $found = false;
        foreach ($items2 as $h) {
            if ((int) $h['id'] === $newHistoryId && $h['comment'] === 'Updated screening time') {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, 'Updated history comment not found in history list');

        // 4. DELETE history entry
        $this->client->request('DELETE', '/api/v2/vacancies/2/history/' . $newHistoryId);
        $resDelete = $this->client->getResponse();
        $this->assertSame(200, $resDelete->getStatusCode());

        // Assert Mercure vacancy_updated event
        $deleteUpdatedEvent = $this->assertMercureEvent('vacancy_updated');
        $this->assertIsArray($deleteUpdatedEvent);

        // Verify entry was removed
        $this->client->request('GET', '/api/v2/vacancies/2/history');
        $resGet3 = $this->client->getResponse();
        $historyData3 = $this->parseJsonResponse($resGet3);
        $items3 = isset($historyData3['history']) ? $historyData3['history'] : $historyData3;

        $stillExists = false;
        foreach ($items3 as $h) {
            if ((int) $h['id'] === $newHistoryId) {
                $stillExists = true;
                break;
            }
        }
        $this->assertFalse($stillExists, 'Deleted history entry still exists');
    }
}
