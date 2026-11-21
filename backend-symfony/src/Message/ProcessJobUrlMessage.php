<?php

declare(strict_types=1);

namespace App\Message;

class ProcessJobUrlMessage
{
    private string $taskId;
    private string $url;
    private ?int $userId;
    private int $attempts;

    public function __construct(string $taskId, string $url, ?int $userId, int $attempts)
    {
        $this->taskId = $taskId;
        $this->url = $url;
        $this->userId = $userId;
        $this->attempts = $attempts;
    }

    public function getTaskId(): string
    {
        return $this->taskId;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function getUserId(): ?int
    {
        return $this->userId;
    }

    public function getAttempts(): int
    {
        return $this->attempts;
    }
}
