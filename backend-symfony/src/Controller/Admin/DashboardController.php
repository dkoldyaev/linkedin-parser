<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\User;
use App\Service\Mercure\MercurePublisherService;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminDashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Dashboard;
use EasyCorp\Bundle\EasyAdminBundle\Config\MenuItem;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractDashboardController;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AdminDashboard(routePath: '/admin', routeName: 'admin')]
#[IsGranted('ROLE_ADMIN')]
class DashboardController extends AbstractDashboardController
{
    private MercurePublisherService $mercure;
    private RequestStack $requestStack;

    public function __construct(MercurePublisherService $mercure, RequestStack $requestStack)
    {
        $this->mercure = $mercure;
        $this->requestStack = $requestStack;
    }

    public function index(): Response
    {
        $response = $this->render('@EasyAdmin/page/content.html.twig');

        /** @var User|null $user */
        $user = $this->getUser();
        if ($user instanceof User) {
            $currentRequest = $this->requestStack->getCurrentRequest();
            if ($currentRequest !== null) {
                $cookie = $this->mercure->createSubscriberCookie($currentRequest, (int)$user->getId());
                $response->headers->setCookie($cookie);
            }
        }

        return $response;
    }

    public function configureDashboard(): Dashboard
    {
        return Dashboard::new()
            ->setTitle('LinkedIn Vacancy Tracker — Admin');
    }

    public function configureAssets(): Assets
    {
        return Assets::new()
            ->addCssFile('/admin/admin-mercure.css')
            ->addJsFile('/admin/admin-mercure.js');
    }

    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Дашборд', 'fa fa-home');
        yield MenuItem::linkTo(UserCrudController::class, 'Пользователи', 'fas fa-users');
        yield MenuItem::linkTo(VacancyCrudController::class, 'Вакансии', 'fas fa-briefcase');
        yield MenuItem::linkTo(ProcessingQueueItemCrudController::class, 'Очередь задач', 'fas fa-tasks');
        yield MenuItem::linkTo(UserLLMTokenUsageCrudController::class, 'Токены LLM', 'fas fa-coins');
        yield MenuItem::linkToUrl('К списку вакансий', 'fas fa-arrow-left', '/');
    }
}
