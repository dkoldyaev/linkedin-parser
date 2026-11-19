<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\VacancyStatusHistory;
use App\Event\VacancyUpdatedDomainEvent;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class VacancyStatusHistorySubscriber implements EventSubscriberInterface
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
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
        if (!isset($changeSet['status']) && !isset($changeSet['lane'])) {
            return;
        }

        $vacancy = $event->getVacancy();
        $fromStatus = isset($changeSet['status']) ? (string)$changeSet['status'][0] : null;
        $toStatus = $vacancy->getStatus();

        $fromLane = isset($changeSet['lane']) ? (int)$changeSet['lane'][0] : null;
        $toLane = $vacancy->getLane();

        $now = new \DateTimeImmutable();
        $history = new VacancyStatusHistory(
            $vacancy,
            $fromStatus,
            $toStatus,
            $fromLane,
            $toLane,
            null,
            $now
        );

        $this->entityManager->persist($history);
        $this->entityManager->flush();
    }
}
