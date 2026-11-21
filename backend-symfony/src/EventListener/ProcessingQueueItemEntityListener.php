<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\ProcessingQueueItem;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Events;
use Doctrine\Persistence\ObjectManager;

#[AsEntityListener(event: Events::postPersist, method: 'postPersist', entity: ProcessingQueueItem::class)]
#[AsEntityListener(event: Events::postUpdate, method: 'postUpdate', entity: ProcessingQueueItem::class)]
#[AsEntityListener(event: Events::postRemove, method: 'postRemove', entity: ProcessingQueueItem::class)]
class ProcessingQueueItemEntityListener
{
    private MercurePublisherService $mercure;

    public function __construct(MercurePublisherService $mercure)
    {
        $this->mercure = $mercure;
    }

    public function postPersist(ProcessingQueueItem $item, PostPersistEventArgs $event): void
    {
        $this->notify($item, $event->getObjectManager());
    }

    public function postUpdate(ProcessingQueueItem $item, PostUpdateEventArgs $event): void
    {
        $this->notify($item, $event->getObjectManager());
    }

    public function postRemove(ProcessingQueueItem $item, PostRemoveEventArgs $event): void
    {
        $this->notify($item, $event->getObjectManager());
    }

    private function notify(ProcessingQueueItem $item, ObjectManager $om): void
    {
        $user = $item->getUser();
        if ($user === null || !$om instanceof EntityManagerInterface) {
            return;
        }

        $repo = $om->getRepository(ProcessingQueueItem::class);
        $totalRemaining = (int)$repo->count([
            'user' => $user,
            'status' => ['pending', 'processing'],
        ]);

        $this->mercure->publish(
            'vacancies:' . $user->getId(),
            MercurePublisherService::EVENT_QUEUE_UPDATED,
            MercurePublisherService::MSG_QUEUE_UPDATED,
            [
                'total_remaining' => $totalRemaining,
            ]
        );
    }
}
