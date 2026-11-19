<?php

declare(strict_types=1);

namespace App\Event;

use Symfony\Contracts\EventDispatcher\Event;

class VacancyDeletedDomainEvent extends Event
{
    private int $vacancyId;
    private ?int $userId;

    public function __construct(int $vacancyId, ?int $userId)
    {
        $this->vacancyId = $vacancyId;
        $this->userId = $userId;
    }

    public function getVacancyId(): int
    {
        return $this->vacancyId;
    }

    public function getUserId(): ?int
    {
        return $this->userId;
    }
}
