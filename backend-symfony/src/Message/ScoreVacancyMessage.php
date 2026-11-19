<?php

declare(strict_types=1);

namespace App\Message;

class ScoreVacancyMessage
{
    private int $vacancyId;
    private int $userId;
    private bool $force;

    public function __construct(int $vacancyId, int $userId, bool $force)
    {
        $this->vacancyId = $vacancyId;
        $this->userId = $userId;
        $this->force = $force;
    }

    public function getVacancyId(): int
    {
        return $this->vacancyId;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function isForce(): bool
    {
        return $this->force;
    }
}
