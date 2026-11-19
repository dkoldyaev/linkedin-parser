<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\User;
use App\Entity\Vacancy;
use App\Event\VacancyCreatedDomainEvent;
use App\Event\VacancyDeletedDomainEvent;
use App\Event\VacancyUpdatedDomainEvent;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

#[AsEntityListener(event: Events::prePersist, method: 'prePersist', entity: Vacancy::class)]
#[AsEntityListener(event: Events::postPersist, method: 'postPersist', entity: Vacancy::class)]
#[AsEntityListener(event: Events::preUpdate, method: 'preUpdate', entity: Vacancy::class)]
#[AsEntityListener(event: Events::postUpdate, method: 'postUpdate', entity: Vacancy::class)]
#[AsEntityListener(event: Events::preRemove, method: 'preRemove', entity: Vacancy::class)]
#[AsEntityListener(event: Events::postRemove, method: 'postRemove', entity: Vacancy::class)]
class VacancyEntityListener
{
    private EventDispatcherInterface $eventDispatcher;
    private Security $security;
    /** @var \SplObjectStorage<Vacancy, array{id: int, userId: ?int}> */
    private \SplObjectStorage $deletedEntities;
    /** @var \SplObjectStorage<Vacancy, array<string, array{0: mixed, 1: mixed}>> */
    private \SplObjectStorage $changeSets;

    public function __construct(EventDispatcherInterface $eventDispatcher, Security $security)
    {
        $this->eventDispatcher = $eventDispatcher;
        $this->security = $security;
        $this->deletedEntities = new \SplObjectStorage();
        $this->changeSets = new \SplObjectStorage();
    }

    public function prePersist(Vacancy $vacancy, PrePersistEventArgs $event): void
    {
        $user = $this->security->getUser();
        if ($user instanceof User) {
            $vacancy->setUser($user);
        }
        $targetUser = $vacancy->getUser();
        if ($targetUser !== null) {
            $targetUser->setLastBoardInteractionAt(new \DateTimeImmutable());
        }
    }

    public function postPersist(Vacancy $vacancy, PostPersistEventArgs $event): void
    {
        $this->eventDispatcher->dispatch(new VacancyCreatedDomainEvent($vacancy));
    }

    public function preUpdate(Vacancy $vacancy, PreUpdateEventArgs $event): void
    {
        $user = $vacancy->getUser();
        if ($user !== null) {
            $user->setLastBoardInteractionAt(new \DateTimeImmutable());
        }
        $this->changeSets[$vacancy] = $event->getEntityChangeSet();
    }

    public function postUpdate(Vacancy $vacancy, PostUpdateEventArgs $event): void
    {
        $changeSet = [];
        if ($this->changeSets->contains($vacancy)) {
            $changeSet = $this->changeSets[$vacancy];
            $this->changeSets->detach($vacancy);
        }
        $this->eventDispatcher->dispatch(new VacancyUpdatedDomainEvent($vacancy, $changeSet));
    }

    public function preRemove(Vacancy $vacancy, PreRemoveEventArgs $event): void
    {
        $user = $vacancy->getUser();
        if ($user !== null) {
            $user->setLastBoardInteractionAt(new \DateTimeImmutable());
        }
        $id = $vacancy->getId();
        if ($id !== null) {
            $this->deletedEntities[$vacancy] = [
                'id' => $id,
                'userId' => $vacancy->getUser()?->getId(),
            ];
        }
    }

    public function postRemove(Vacancy $vacancy, PostRemoveEventArgs $event): void
    {
        if ($this->deletedEntities->contains($vacancy)) {
            $info = $this->deletedEntities[$vacancy];
            $this->deletedEntities->detach($vacancy);
            $this->eventDispatcher->dispatch(new VacancyDeletedDomainEvent($info['id'], $info['userId']));
        } elseif ($vacancy->getId() !== null) {
            $this->eventDispatcher->dispatch(new VacancyDeletedDomainEvent($vacancy->getId(), $vacancy->getUser()?->getId()));
        }
    }
}
