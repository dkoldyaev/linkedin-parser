<?php

declare(strict_types=1);

namespace App\Service\Mercure;

use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

class MercurePublisherService
{
    public const DEFAULT_TOPIC = 'vacancies';

    public const EVENT_VACANCY_CREATED = 'vacancy_created';
    public const EVENT_VACANCY_UPDATED = 'vacancy_updated';
    public const EVENT_VACANCY_DELETED = 'vacancy_deleted';
    public const EVENT_TASK_FAILED = 'task_failed';
    public const EVENT_QUEUE_UPDATED = 'queue_updated';
    public const EVENT_QUEUE_STATE = 'queue_state';
    public const EVENT_EXTENSION_TASK = 'extension_task';

    public const MSG_VACANCY_CREATED = 'VACANCY_CREATED';
    public const MSG_VACANCY_UPDATED = 'VACANCY_UPDATED';
    public const MSG_VACANCY_DELETED = 'VACANCY_DELETED';
    public const MSG_TASK_FAILED = 'TASK_FAILED';
    public const MSG_QUEUE_UPDATED = 'QUEUE_UPDATED';
    public const MSG_EXTENSION_TASK = 'EXTENSION_TASK';

    private HubInterface $hub;

    public function __construct(HubInterface $hub)
    {
        $this->hub = $hub;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function publish(string $topic, string $eventType, string $messageCode, array $payload): void
    {
        $data = [
            'type' => $eventType,
            'message' => $messageCode,
            'data' => $payload,
            'timestamp' => microtime(true),
        ];

        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $update = new Update($topic, $json);

        $this->hub->publish($update);
    }
}
