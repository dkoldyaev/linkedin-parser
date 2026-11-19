<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\ApiKey;
use App\Entity\ProcessingQueueItem;
use App\Entity\UserLLMTokenUsage;
use App\Entity\Vacancy;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\ORM\Events;

#[AsDoctrineListener(event: Events::postPersist, priority: 500)]
#[AsDoctrineListener(event: Events::postUpdate, priority: 500)]
#[AsDoctrineListener(event: Events::preRemove, priority: 500)]
#[AsDoctrineListener(event: Events::postRemove, priority: 500)]
class AdminMercureBroadcastListener
{
    private MercurePublisherService $mercure;
    /** @var \SplObjectStorage<object, array<string, mixed>> */
    private \SplObjectStorage $deletedEntities;

    public function __construct(MercurePublisherService $mercure)
    {
        $this->mercure = $mercure;
        $this->deletedEntities = new \SplObjectStorage();
    }

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof Vacancy) {
            $this->mercure->publish(
                MercurePublisherService::ADMIN_TOPIC,
                MercurePublisherService::EVENT_VACANCY_CREATED,
                MercurePublisherService::MSG_VACANCY_CREATED,
                [
                    'entity' => 'vacancy',
                    'action' => 'created',
                    'id' => $entity->getId(),
                    'vacancy_id' => $entity->getId(),
                    'title' => $entity->getTitle(),
                    'company' => $entity->getCompany(),
                    'status' => $entity->getStatus(),
                    'url' => $entity->getUrl(),
                    'user_id' => $entity->getUser()?->getId(),
                    'user_email' => $entity->getUser()?->getEmail(),
                    'created_at' => $entity->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                ]
            );
        } elseif ($entity instanceof ProcessingQueueItem) {
            $this->mercure->publish(
                MercurePublisherService::ADMIN_TOPIC,
                MercurePublisherService::EVENT_QUEUE_UPDATED,
                MercurePublisherService::MSG_QUEUE_UPDATED,
                [
                    'entity' => 'queue',
                    'action' => 'created',
                    'id' => $entity->getId(),
                    'task_id' => $entity->getTaskId(),
                    'url' => $entity->getUrl(),
                    'status' => $entity->getStatus(),
                    'stage' => $entity->getStage() ?? 'queued',
                    'attempts' => $entity->getAttempts(),
                    'vacancy_id' => $entity->getVacancyId(),
                    'user_id' => $entity->getUser()?->getId(),
                    'user_email' => $entity->getUser()?->getEmail(),
                    'created_at' => $entity->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                ]
            );
        } elseif ($entity instanceof UserLLMTokenUsage) {
            $this->mercure->publish(
                MercurePublisherService::ADMIN_TOPIC,
                MercurePublisherService::EVENT_TOKEN_USAGE_CREATED,
                MercurePublisherService::MSG_TOKEN_USAGE_CREATED,
                [
                    'entity' => 'token_usage',
                    'action' => 'created',
                    'id' => $entity->getId(),
                    'provider' => $entity->getProvider(),
                    'model' => $entity->getModel(),
                    'prompt_tokens' => $entity->getPromptTokens(),
                    'completion_tokens' => $entity->getCompletionTokens(),
                    'total_tokens' => $entity->getTotalTokens(),
                    'user_id' => $entity->getUser()?->getId(),
                    'user_email' => $entity->getUser()?->getEmail(),
                    'created_at' => $entity->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                ]
            );
        } elseif ($entity instanceof ApiKey) {
            $this->mercure->publish(
                MercurePublisherService::ADMIN_TOPIC,
                'api_key_created',
                'API_KEY_CREATED',
                [
                    'entity' => 'api_key',
                    'action' => 'created',
                    'id' => $entity->getId(),
                    'name' => $entity->getName(),
                    'prefix' => $entity->getPrefix(),
                    'user_id' => $entity->getUser()?->getId(),
                    'user_email' => $entity->getUser()?->getEmail(),
                    'created_at' => $entity->getCreatedAt()?->format(\DateTimeInterface::ATOM),
                ]
            );
        }
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof Vacancy) {
            $this->mercure->publish(
                MercurePublisherService::ADMIN_TOPIC,
                MercurePublisherService::EVENT_VACANCY_UPDATED,
                MercurePublisherService::MSG_VACANCY_UPDATED,
                [
                    'entity' => 'vacancy',
                    'action' => 'updated',
                    'id' => $entity->getId(),
                    'vacancy_id' => $entity->getId(),
                    'title' => $entity->getTitle(),
                    'company' => $entity->getCompany(),
                    'status' => $entity->getStatus(),
                    'url' => $entity->getUrl(),
                    'user_id' => $entity->getUser()?->getId(),
                    'user_email' => $entity->getUser()?->getEmail(),
                    'updated_at' => $entity->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
                ]
            );
        } elseif ($entity instanceof ProcessingQueueItem) {
            $isFailed = $entity->getStatus() === 'failed';
            $this->mercure->publish(
                MercurePublisherService::ADMIN_TOPIC,
                $isFailed ? MercurePublisherService::EVENT_TASK_FAILED : MercurePublisherService::EVENT_QUEUE_UPDATED,
                $isFailed ? MercurePublisherService::MSG_TASK_FAILED : MercurePublisherService::MSG_QUEUE_UPDATED,
                [
                    'entity' => 'queue',
                    'action' => 'updated',
                    'id' => $entity->getId(),
                    'task_id' => $entity->getTaskId(),
                    'url' => $entity->getUrl(),
                    'status' => $entity->getStatus(),
                    'stage' => $entity->getStage() ?? 'queued',
                    'attempts' => $entity->getAttempts(),
                    'error' => $entity->getError(),
                    'vacancy_id' => $entity->getVacancyId(),
                    'user_id' => $entity->getUser()?->getId(),
                    'user_email' => $entity->getUser()?->getEmail(),
                    'updated_at' => $entity->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
                ]
            );
        } elseif ($entity instanceof UserLLMTokenUsage) {
            $this->mercure->publish(
                MercurePublisherService::ADMIN_TOPIC,
                'token_usage_updated',
                'TOKEN_USAGE_UPDATED',
                [
                    'entity' => 'token_usage',
                    'action' => 'updated',
                    'id' => $entity->getId(),
                    'provider' => $entity->getProvider(),
                    'model' => $entity->getModel(),
                    'prompt_tokens' => $entity->getPromptTokens(),
                    'completion_tokens' => $entity->getCompletionTokens(),
                    'total_tokens' => $entity->getTotalTokens(),
                    'user_id' => $entity->getUser()?->getId(),
                    'user_email' => $entity->getUser()?->getEmail(),
                ]
            );
        }
    }

    public function preRemove(PreRemoveEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof Vacancy) {
            $this->deletedEntities[$entity] = [
                'entity' => 'vacancy',
                'id' => $entity->getId(),
                'title' => $entity->getTitle(),
                'user_id' => $entity->getUser()?->getId(),
            ];
        } elseif ($entity instanceof ProcessingQueueItem) {
            $this->deletedEntities[$entity] = [
                'entity' => 'queue',
                'id' => $entity->getId(),
                'task_id' => $entity->getTaskId(),
                'user_id' => $entity->getUser()?->getId(),
            ];
        } elseif ($entity instanceof UserLLMTokenUsage) {
            $this->deletedEntities[$entity] = [
                'entity' => 'token_usage',
                'id' => $entity->getId(),
                'provider' => $entity->getProvider(),
                'user_id' => $entity->getUser()?->getId(),
            ];
        } elseif ($entity instanceof ApiKey) {
            $this->deletedEntities[$entity] = [
                'entity' => 'api_key',
                'id' => $entity->getId(),
                'name' => $entity->getName(),
                'user_id' => $entity->getUser()?->getId(),
            ];
        }
    }

    public function postRemove(PostRemoveEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($this->deletedEntities->contains($entity)) {
            $info = $this->deletedEntities[$entity];
            $this->deletedEntities->detach($entity);

            $entityType = $info['entity'] ?? '';
            if ($entityType === 'vacancy') {
                $this->mercure->publish(
                    MercurePublisherService::ADMIN_TOPIC,
                    MercurePublisherService::EVENT_VACANCY_DELETED,
                    MercurePublisherService::MSG_VACANCY_DELETED,
                    [
                        'entity' => 'vacancy',
                        'action' => 'deleted',
                        'id' => $info['id'],
                        'vacancy_id' => $info['id'],
                        'title' => $info['title'],
                        'user_id' => $info['user_id'],
                    ]
                );
            } elseif ($entityType === 'queue') {
                $this->mercure->publish(
                    MercurePublisherService::ADMIN_TOPIC,
                    'queue_deleted',
                    'QUEUE_DELETED',
                    [
                        'entity' => 'queue',
                        'action' => 'deleted',
                        'id' => $info['id'],
                        'task_id' => $info['task_id'],
                        'user_id' => $info['user_id'],
                    ]
                );
            } elseif ($entityType === 'token_usage') {
                $this->mercure->publish(
                    MercurePublisherService::ADMIN_TOPIC,
                    'token_usage_deleted',
                    'TOKEN_USAGE_DELETED',
                    [
                        'entity' => 'token_usage',
                        'action' => 'deleted',
                        'id' => $info['id'],
                        'provider' => $info['provider'],
                        'user_id' => $info['user_id'],
                    ]
                );
            } elseif ($entityType === 'api_key') {
                $this->mercure->publish(
                    MercurePublisherService::ADMIN_TOPIC,
                    'api_key_deleted',
                    'API_KEY_DELETED',
                    [
                        'entity' => 'api_key',
                        'action' => 'deleted',
                        'id' => $info['id'],
                        'name' => $info['name'],
                        'user_id' => $info['user_id'],
                    ]
                );
            }
        }
    }
}
