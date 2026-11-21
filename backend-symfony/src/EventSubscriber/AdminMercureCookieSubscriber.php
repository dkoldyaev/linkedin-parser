<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\User;
use App\Service\Mercure\MercurePublisherService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class AdminMercureCookieSubscriber implements EventSubscriberInterface
{
    private Security $security;
    private MercurePublisherService $mercure;

    public function __construct(Security $security, MercurePublisherService $mercure)
    {
        $this->security = $security;
        $this->mercure = $mercure;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => ['onKernelResponse', -10],
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!str_starts_with($request->getPathInfo(), '/admin')) {
            return;
        }

        $user = $this->security->getUser();
        if (!$user instanceof User || !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return;
        }

        $cookie = $this->mercure->createAdminSubscriberCookie($request, (int)$user->getId());
        $event->getResponse()->headers->setCookie($cookie);
    }
}
