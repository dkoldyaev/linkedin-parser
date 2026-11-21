<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\VacancyStatusHistory;
use App\Event\VacancyCreatedDomainEvent;
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
            VacancyCreatedDomainEvent::class => 'onVacancyCreated',
            VacancyUpdatedDomainEvent::class => 'onVacancyUpdated',
        ];
    }

    public function onVacancyCreated(VacancyCreatedDomainEvent $event): void
    {
        $vacancy = $event->getVacancy();
        $now = new \DateTimeImmutable();

        $history = new VacancyStatusHistory(
            $vacancy,
            null,
            $vacancy->getStatus(),
            null,
            $vacancy->getLane(),
            null,
            $now
        );

        $vacancy->getHistory()->add($history);
        $this->entityManager->persist($history);
        $this->entityManager->flush();
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

        $rawFromLane = isset($changeSet['lane']) ? (int)$changeSet['lane'][0] : null;
        $fromLane = $rawFromLane !== null ? $rawFromLane : 0;
        $toLane = $vacancy->getLane();
        $now = new \DateTimeImmutable();

        foreach ($vacancy->getHistory() as $existing) {
            if ($existing->getToStatus() === $toStatus && $existing->getToLane() === $toLane && abs($existing->getCreatedAt()->getTimestamp() - $now->getTimestamp()) < 2) {
                return;
            }
        }

        $history = new VacancyStatusHistory(
            $vacancy,
            $fromStatus,
            $toStatus,
            $fromLane,
            $toLane,
            null,
            $now
        );

        $vacancy->getHistory()->add($history);
        $this->entityManager->persist($history);
        $this->entityManager->flush();
    }
}
