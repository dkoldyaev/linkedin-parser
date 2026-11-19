<?php

declare(strict_types=1);

namespace App\Service\Mercure;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Jwt\Grant;
use Symfony\Component\Mercure\Update;

class MercurePublisherService
{
    public const DEFAULT_TOPIC = 'vacancies';
    public const COOKIE_NAME = 'mercureAuthorization';
    public const SUBSCRIBER_TTL = 3600;

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
    private LoggerInterface $logger;

    public function __construct(HubInterface $hub, LoggerInterface $logger)
    {
        $this->hub = $hub;
        $this->logger = $logger;
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function publish(string $topic, string $eventType, string $messageCode, array $payload): void
    {
        $data = [
            'type' => $eventType,
            'message_code' => $messageCode,
            'message' => $messageCode,
            'timestamp' => microtime(true),
            ...$payload,
        ];

        if (!isset($data['data'])) {
            $data['data'] = $payload;
        }

        try {
            $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $update = new Update($topic, $json);

            $this->hub->publish($update);
        } catch (\Throwable $e) {
            $this->logger->error(sprintf('Mercure publish error for topic "%s": %s', $topic, $e->getMessage()), [
                'exception' => $e,
            ]);
        }
    }

    public function createSubscriberCookie(Request $request, int $userId): Cookie
    {
        $topic = 'vacancies:' . $userId;
        $factory = $this->hub->getFactory();
        if ($factory === null) {
            throw new \RuntimeException('Mercure Hub does not have a TokenFactory configured.');
        }

        $grant = new Grant([Grant::ACTION_SUBSCRIBE], [$topic, self::DEFAULT_TOPIC]);
        $jwt = $factory->create([$grant], [
            'sub' => (string)$userId,
            'exp' => new \DateTimeImmutable('+' . self::SUBSCRIBER_TTL . ' seconds'),
        ]);

        $forwardedProto = $request->headers->get('x-forwarded-proto');
        $isSecure = $request->isSecure()
            || $forwardedProto === 'https'
            || (isset($_SERVER['APP_URL']) && str_starts_with((string)$_SERVER['APP_URL'], 'https://'));

        return Cookie::create(self::COOKIE_NAME)
            ->withValue($jwt)
            ->withExpires(time() + self::SUBSCRIBER_TTL)
            ->withPath('/.well-known/mercure')
            ->withHttpOnly(true)
            ->withSameSite('lax')
            ->withSecure($isSecure);
    }

    public function createClearCookie(): Cookie
    {
        return Cookie::create(self::COOKIE_NAME)
            ->withValue('')
            ->withExpires(1)
            ->withPath('/.well-known/mercure')
            ->withHttpOnly(true);
    }
}
