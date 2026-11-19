<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Event\VacancyUpdatedDomainEvent;
use App\Service\VacancyScoringService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class VacancyDescriptionChangeSubscriber implements EventSubscriberInterface
{
    private VacancyScoringService $scoringService;

    public function __construct(VacancyScoringService $scoringService)
    {
        $this->scoringService = $scoringService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            VacancyUpdatedDomainEvent::class => 'onVacancyUpdated',
        ];
    }

    public function onVacancyUpdated(VacancyUpdatedDomainEvent $event): void
    {
        $changeSet = $event->getChangeSet();
        if (!isset($changeSet['description'])) {
            return;
        }

        $oldDesc = $changeSet['description'][0] ?? null;
        $newDesc = $changeSet['description'][1] ?? null;

        if ($oldDesc === $newDesc) {
            return;
        }

        $vacancy = $event->getVacancy();
        $user = $vacancy->getUser();
        if ($user === null) {
            return;
        }

        $this->scoringService->triggerScoringForVacancy($vacancy, $user);
    }
}
