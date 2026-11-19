<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\ApprovedCV;
use App\Entity\ProcessingQueueItem;
use App\Entity\VacancyCVAnalysis;
use App\Service\VacancyScoringService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Doctrine\Persistence\ObjectManager;

#[AsEntityListener(event: Events::postPersist, method: 'postPersist', entity: ApprovedCV::class)]
#[AsEntityListener(event: Events::preUpdate, method: 'preUpdate', entity: ApprovedCV::class)]
#[AsEntityListener(event: Events::postUpdate, method: 'postUpdate', entity: ApprovedCV::class)]
#[AsEntityListener(event: Events::postRemove, method: 'postRemove', entity: ApprovedCV::class)]
class ApprovedCVEntityListener
{
    private VacancyScoringService $scoringService;
    /** @var \SplObjectStorage<ApprovedCV, array<string, array{0: mixed, 1: mixed}>> */
    private \SplObjectStorage $changeSets;

    public function __construct(VacancyScoringService $scoringService)
    {
        $this->scoringService = $scoringService;
        $this->changeSets = new \SplObjectStorage();
    }

    public function postPersist(ApprovedCV $cv, PostPersistEventArgs $event): void
    {
        $this->handleCvChange($cv, $event->getObjectManager());
    }

    public function preUpdate(ApprovedCV $cv, PreUpdateEventArgs $event): void
    {
        $this->changeSets[$cv] = $event->getEntityChangeSet();
    }

    public function postUpdate(ApprovedCV $cv, PostUpdateEventArgs $event): void
    {
        $changeSet = [];
        if ($this->changeSets->contains($cv)) {
            $changeSet = $this->changeSets[$cv];
            $this->changeSets->detach($cv);
        }

        if (isset($changeSet['content'])) {
            $this->handleCvChange($cv, $event->getObjectManager());
        }
    }

    public function postRemove(ApprovedCV $cv, PostRemoveEventArgs $event): void
    {
        $user = $cv->getUser();
        if ($user === null) {
            return;
        }

        $om = $event->getObjectManager();
        if ($om instanceof EntityManagerInterface) {
            $analyses = $om->getRepository(VacancyCVAnalysis::class)->findBy(['user' => $user]);
            foreach ($analyses as $analysis) {
                $om->remove($analysis);
            }
            $om->flush();
        }
    }

    private function handleCvChange(ApprovedCV $cv, ObjectManager $om): void
    {
        $user = $cv->getUser();
        if ($user === null) {
            return;
        }

        if (!$om instanceof EntityManagerInterface) {
            return;
        }

        $now = new \DateTimeImmutable();
        $cvTaskId = substr(bin2hex(random_bytes(4)), 0, 8);
        $cvQueueItem = new ProcessingQueueItem(
            $cvTaskId,
            'cv://user/' . $user->getId(),
            'pending',
            'cv_parsing',
            0,
            $now
        );
        $cvQueueItem->setUser($user);
        $om->persist($cvQueueItem);
        $om->flush();

        $this->scoringService->triggerScoringForUserVacancies($user);
    }
}
