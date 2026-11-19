<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Vacancy;
use App\Event\VacancyCreatedDomainEvent;
use App\Event\VacancyDeletedDomainEvent;
use App\Event\VacancyUpdatedDomainEvent;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Events;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

#[AsEntityListener(event: Events::postPersist, method: 'postPersist', entity: Vacancy::class)]
#[AsEntityListener(event: Events::postUpdate, method: 'postUpdate', entity: Vacancy::class)]
#[AsEntityListener(event: Events::postRemove, method: 'postRemove', entity: Vacancy::class)]
class VacancyEntityListener
{
    private EventDispatcherInterface $eventDispatcher;

    public function __construct(EventDispatcherInterface $eventDispatcher)
    {
        $this->eventDispatcher = $eventDispatcher;
    }

    public function postPersist(Vacancy $vacancy, PostPersistEventArgs $event): void
    {
        $this->eventDispatcher->dispatch(new VacancyCreatedDomainEvent($vacancy));
    }

    public function postUpdate(Vacancy $vacancy, PostUpdateEventArgs $event): void
    {
        $changeSet = $event->getObjectManager()->getUnitOfWork()->getEntityChangeSet($vacancy);
        $this->eventDispatcher->dispatch(new VacancyUpdatedDomainEvent($vacancy, $changeSet));
    }

    public function postRemove(Vacancy $vacancy, PostRemoveEventArgs $event): void
    {
        $id = $vacancy->getId();
        if ($id !== null) {
            $userId = $vacancy->getUser()?->getId();
            $this->eventDispatcher->dispatch(new VacancyDeletedDomainEvent($id, $userId));
        }
    }
}
