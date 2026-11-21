<?php

declare(strict_types=1);

namespace App\Tests\Support;

use Symfony\Component\Mercure\Jwt\TokenFactoryInterface;
use Symfony\Component\Mercure\ProtocolVersion;
use Symfony\Component\Mercure\RemoteHubInterface;
use Symfony\Component\Mercure\Update;

class TestMercureHub implements RemoteHubInterface
{
    private RemoteHubInterface $inner;
    /**
     * @var array<int, array{topics: array<int, string>, data: array<string, mixed>, raw: string}>
     */
    private static array $publishedUpdates = [];

    public function __construct(RemoteHubInterface $inner)
    {
        $this->inner = $inner;
    }

    public function getUrl(): string
    {
        return $this->inner->getUrl();
    }

    public function getPublicUrl(): string
    {
        return $this->inner->getPublicUrl();
    }

    public function getFactory(): ?TokenFactoryInterface
    {
        return $this->inner->getFactory();
    }

    public function publish(Update $update): string
    {
        $decoded = json_decode($update->getData(), true);
        $data = is_array($decoded) ? $decoded : [];

        self::$publishedUpdates[] = [
            'topics' => $update->getTopics(),
            'data' => $data,
            'raw' => $update->getData(),
        ];

        return 'urn:uuid:test-mercure-update';
    }

    public function getProtocolVersion(): ProtocolVersion
    {
        return $this->inner->getProtocolVersion();
    }

    public function getCookieName(): string
    {
        return $this->inner->getCookieName();
    }

    /**
     * @return array<int, array{topics: array<int, string>, data: array<string, mixed>, raw: string}>
     */
    public function getPublishedUpdates(): array
    {
        return self::$publishedUpdates;
    }

    public function clear(): void
    {
        self::$publishedUpdates = [];
    }

    public function hasEvent(string $eventType): bool
    {
        foreach (self::$publishedUpdates as $item) {
            if (isset($item['data']['type']) && $item['data']['type'] === $eventType) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getLastEvent(string $eventType): ?array
    {
        for ($i = count(self::$publishedUpdates) - 1; $i >= 0; $i--) {
            if (isset(self::$publishedUpdates[$i]['data']['type']) && self::$publishedUpdates[$i]['data']['type'] === $eventType) {
                return self::$publishedUpdates[$i]['data'];
            }
        }

        return null;
    }
}
