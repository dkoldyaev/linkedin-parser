<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Event\VacancyCreatedDomainEvent;
use App\Event\VacancyDeletedDomainEvent;
use App\Event\VacancyUpdatedDomainEvent;
use App\Service\Mercure\MercurePublisherService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Serializer\SerializerInterface;

class MercureBroadcastSubscriber implements EventSubscriberInterface
{
    private MercurePublisherService $mercure;
    private SerializerInterface $serializer;

    public function __construct(MercurePublisherService $mercure, SerializerInterface $serializer)
    {
        $this->mercure = $mercure;
        $this->serializer = $serializer;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            VacancyCreatedDomainEvent::class => 'onVacancyCreated',
            VacancyUpdatedDomainEvent::class => 'onVacancyUpdated',
            VacancyDeletedDomainEvent::class => 'onVacancyDeleted',
        ];
    }

    public function onVacancyCreated(VacancyCreatedDomainEvent $event): void
    {
        $vacancy = $event->getVacancy();
        $payload = json_decode($this->serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read']]), true);

        $topic = $vacancy->getUser() !== null
            ? sprintf('vacancies/%d', $vacancy->getUser()->getId())
            : MercurePublisherService::DEFAULT_TOPIC;

        $this->mercure->publish(
            $topic,
            MercurePublisherService::EVENT_VACANCY_CREATED,
            MercurePublisherService::MSG_VACANCY_CREATED,
            $payload
        );
    }

    public function onVacancyUpdated(VacancyUpdatedDomainEvent $event): void
    {
        $vacancy = $event->getVacancy();
        $payload = json_decode($this->serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read']]), true);

        $topic = $vacancy->getUser() !== null
            ? sprintf('vacancies/%d', $vacancy->getUser()->getId())
            : MercurePublisherService::DEFAULT_TOPIC;

        $this->mercure->publish(
            $topic,
            MercurePublisherService::EVENT_VACANCY_UPDATED,
            MercurePublisherService::MSG_VACANCY_UPDATED,
            $payload
        );
    }

    public function onVacancyDeleted(VacancyDeletedDomainEvent $event): void
    {
        $topic = $event->getUserId() !== null
            ? sprintf('vacancies/%d', $event->getUserId())
            : MercurePublisherService::DEFAULT_TOPIC;

        $this->mercure->publish(
            $topic,
            MercurePublisherService::EVENT_VACANCY_DELETED,
            MercurePublisherService::MSG_VACANCY_DELETED,
            ['id' => $event->getVacancyId()]
        );
    }
}
