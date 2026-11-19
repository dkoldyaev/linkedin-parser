<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Event\VacancyCreatedDomainEvent;
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
            VacancyCreatedDomainEvent::class => 'onVacancyCreated',
            VacancyUpdatedDomainEvent::class => 'onVacancyUpdated',
        ];
    }

    public function onVacancyCreated(VacancyCreatedDomainEvent $event): void
    {
        $vacancy = $event->getVacancy();
        $desc = $vacancy->getDescription();
        if ($desc === null || trim($desc) === '') {
            return;
        }

        $user = $vacancy->getUser();
        if ($user === null) {
            return;
        }

        $this->scoringService->triggerScoringForVacancy($vacancy, $user);
    }

    public function onVacancyUpdated(VacancyUpdatedDomainEvent $event): void
    {
        $changeSet = $event->getChangeSet();
        $vacancy = $event->getVacancy();
        $user = $vacancy->getUser();
        if ($user === null) {
            return;
        }

        $contentFields = ['title', 'description', 'techStack', 'company'];
        $hasContentChanged = false;
        foreach ($contentFields as $field) {
            if (isset($changeSet[$field])) {
                $hasContentChanged = true;
                break;
            }
        }

        if ($hasContentChanged) {
            $this->scoringService->markAnalysisOutdatedForVacancy($vacancy, $user);
        }

        if (!isset($changeSet['description'])) {
            return;
        }

        $oldDesc = $changeSet['description'][0] ?? null;
        $newDesc = $changeSet['description'][1] ?? null;

        if ($oldDesc === $newDesc) {
            return;
        }

        $this->scoringService->triggerScoringForVacancy($vacancy, $user);
    }
}
