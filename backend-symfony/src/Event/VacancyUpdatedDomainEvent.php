<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\Vacancy;
use Symfony\Contracts\EventDispatcher\Event;

class VacancyUpdatedDomainEvent extends Event
{
    private Vacancy $vacancy;
    /**
     * @var array<string, array{0: mixed, 1: mixed}>
     */
    private array $changeSet;

    /**
     * @param array<string, array{0: mixed, 1: mixed}> $changeSet
     */
    public function __construct(Vacancy $vacancy, array $changeSet)
    {
        $this->vacancy = $vacancy;
        $this->changeSet = $changeSet;
    }

    public function getVacancy(): Vacancy
    {
        return $this->vacancy;
    }

    /**
     * @return array<string, array{0: mixed, 1: mixed}>
     */
    public function getChangeSet(): array
    {
        return $this->changeSet;
    }
}
