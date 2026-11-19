<?php

declare(strict_types=1);

namespace App\Event;

use App\Entity\Vacancy;
use Symfony\Contracts\EventDispatcher\Event;

class VacancyCreatedDomainEvent extends Event
{
    private Vacancy $vacancy;

    public function __construct(Vacancy $vacancy)
    {
        $this->vacancy = $vacancy;
    }

    public function getVacancy(): Vacancy
    {
        return $this->vacancy;
    }
}
