<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\ProcessingQueueItem;
use App\Message\ProcessJobUrlMessage;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Dto\BatchActionDto;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\UrlField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\ChoiceFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\EntityFilter;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;

class ProcessingQueueItemCrudController extends AbstractCrudController
{
    private AdminUrlGenerator $adminUrlGenerator;
    private MessageBusInterface $messageBus;
    private MercurePublisherService $mercure;

    public function __construct(
        AdminUrlGenerator $adminUrlGenerator,
        MessageBusInterface $messageBus,
        MercurePublisherService $mercure
    ) {
        $this->adminUrlGenerator = $adminUrlGenerator;
        $this->messageBus = $messageBus;
        $this->mercure = $mercure;
    }

    public static function getEntityFqcn(): string
    {
        return ProcessingQueueItem::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Задача очереди')
            ->setEntityLabelInPlural('Очередь задач')
            ->setDefaultSort(['id' => 'DESC']);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(ChoiceFilter::new('status')->setChoices([
                'Pending' => 'pending',
                'Processing' => 'processing',
                'Completed' => 'completed',
                'Failed' => 'failed',
                'Stopped' => 'stopped',
            ]))
            ->add(EntityFilter::new('user', 'Пользователь'));
    }

    public function configureActions(Actions $actions): Actions
    {
        $prioritizeAction = Action::new('prioritize', 'Приоритет +10', 'fa fa-arrow-up')
            ->linkToCrudAction('prioritizeTask')
            ->displayIf(fn (ProcessingQueueItem $item): bool => in_array($item->getStatus(), ['pending', 'processing'], true));

        $stopAction = Action::new('stopTask', 'Остановить', 'fa fa-stop')
            ->linkToCrudAction('stopTask')
            ->displayIf(fn (ProcessingQueueItem $item): bool => in_array($item->getStatus(), ['pending', 'processing'], true));

        $retryAction = Action::new('retryTask', 'Перезапустить', 'fa fa-redo')
            ->linkToCrudAction('retryTask')
            ->displayIf(fn (ProcessingQueueItem $item): bool => in_array($item->getStatus(), ['failed', 'stopped'], true));

        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_INDEX, $prioritizeAction)
            ->add(Crud::PAGE_INDEX, $stopAction)
            ->add(Crud::PAGE_INDEX, $retryAction)
            ->add(Crud::PAGE_DETAIL, $prioritizeAction)
            ->add(Crud::PAGE_DETAIL, $stopAction)
            ->add(Crud::PAGE_DETAIL, $retryAction)
            ->addBatchAction(Action::new('batchPrioritize', 'Повысить приоритет')
                ->linkToCrudAction('batchPrioritize')
                ->addCssClass('btn btn-primary'))
            ->addBatchAction(Action::new('batchRetry', 'Перезапустить выбранные')
                ->linkToCrudAction('batchRetry')
                ->addCssClass('btn btn-success'))
            ->addBatchAction(Action::new('batchStop', 'Остановить выбранные')
                ->linkToCrudAction('batchStop')
                ->addCssClass('btn btn-warning'));
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id', 'ID')->hideOnForm();
        yield TextField::new('taskId', 'Task ID')->hideOnForm();
        yield AssociationField::new('user', 'Пользователь');
        yield UrlField::new('url', 'URL вакансии');
        yield ChoiceField::new('status', 'Статус')
            ->setChoices([
                'Pending' => 'pending',
                'Processing' => 'processing',
                'Completed' => 'completed',
                'Failed' => 'failed',
                'Stopped' => 'stopped',
            ])
            ->renderAsBadges([
                'pending' => 'warning',
                'processing' => 'info',
                'completed' => 'success',
                'failed' => 'danger',
                'stopped' => 'secondary',
            ]);
        yield TextField::new('stage', 'Этап');
        yield IntegerField::new('priority', 'Приоритет');
        yield IntegerField::new('attempts', 'Попыток');
        yield IntegerField::new('vacancyId', 'ID вакансии')->hideOnIndex();
        yield TextareaField::new('error', 'Ошибка')->hideOnIndex();
        yield DateTimeField::new('createdAt', 'Создано')->hideOnForm();
        yield DateTimeField::new('updatedAt', 'Обновлено')->hideOnForm();
    }

    public function prioritizeTask(AdminContext $context, EntityManagerInterface $em): Response
    {
        /** @var ProcessingQueueItem $item */
        $item = $context->getEntity()->getInstance();
        $item->setPriority($item->getPriority() + 10);
        $item->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();

        $this->addFlash('success', sprintf('Приоритет задачи %s увеличен до %d', $item->getTaskId(), $item->getPriority()));

        return $this->redirect($this->adminUrlGenerator->setAction(Action::INDEX)->generateUrl());
    }

    public function stopTask(AdminContext $context, EntityManagerInterface $em): Response
    {
        /** @var ProcessingQueueItem $item */
        $item = $context->getEntity()->getInstance();
        $item->setStatus('stopped');
        $item->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();

        $this->addFlash('warning', sprintf('Задача %s остановлена', $item->getTaskId()));

        return $this->redirect($this->adminUrlGenerator->setAction(Action::INDEX)->generateUrl());
    }

    public function retryTask(AdminContext $context, EntityManagerInterface $em): Response
    {
        /** @var ProcessingQueueItem $item */
        $item = $context->getEntity()->getInstance();
        $item->setStatus('pending');
        $item->setError(null);
        $item->setAttempts(0);
        $item->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();

        $userId = $item->getUser() !== null ? $item->getUser()->getId() : null;
        $this->messageBus->dispatch(new ProcessJobUrlMessage(
            $item->getTaskId(),
            $item->getUrl(),
            $userId,
            0
        ));

        $this->addFlash('success', sprintf('Задача %s перезапущена и отправлена в очередь', $item->getTaskId()));

        return $this->redirect($this->adminUrlGenerator->setAction(Action::INDEX)->generateUrl());
    }

    public function batchPrioritize(BatchActionDto $batchActionDto, EntityManagerInterface $em): Response
    {
        $repo = $em->getRepository(ProcessingQueueItem::class);
        $count = 0;
        foreach ($batchActionDto->getEntityIds() as $id) {
            $item = $repo->find($id);
            if ($item instanceof ProcessingQueueItem) {
                $item->setPriority($item->getPriority() + 10);
                $item->setUpdatedAt(new \DateTimeImmutable());
                $count++;
            }
        }
        $em->flush();

        $this->addFlash('success', sprintf('Приоритет повышен для %d задач', $count));

        return $this->redirect($this->adminUrlGenerator->setAction(Action::INDEX)->generateUrl());
    }

    public function batchStop(BatchActionDto $batchActionDto, EntityManagerInterface $em): Response
    {
        $repo = $em->getRepository(ProcessingQueueItem::class);
        $count = 0;
        foreach ($batchActionDto->getEntityIds() as $id) {
            $item = $repo->find($id);
            if ($item instanceof ProcessingQueueItem) {
                $item->setStatus('stopped');
                $item->setUpdatedAt(new \DateTimeImmutable());
                $count++;
            }
        }
        $em->flush();

        $this->addFlash('warning', sprintf('Остановлено %d задач', $count));

        return $this->redirect($this->adminUrlGenerator->setAction(Action::INDEX)->generateUrl());
    }

    public function batchRetry(BatchActionDto $batchActionDto, EntityManagerInterface $em): Response
    {
        $repo = $em->getRepository(ProcessingQueueItem::class);
        $count = 0;
        foreach ($batchActionDto->getEntityIds() as $id) {
            $item = $repo->find($id);
            if ($item instanceof ProcessingQueueItem) {
                $item->setStatus('pending');
                $item->setError(null);
                $item->setAttempts(0);
                $item->setUpdatedAt(new \DateTimeImmutable());

                $userId = $item->getUser() !== null ? $item->getUser()->getId() : null;
                $this->messageBus->dispatch(new ProcessJobUrlMessage(
                    $item->getTaskId(),
                    $item->getUrl(),
                    $userId,
                    0
                ));
                $count++;
            }
        }
        $em->flush();

        $this->addFlash('success', sprintf('Перезапущено и отправлено в очередь %d задач', $count));

        return $this->redirect($this->adminUrlGenerator->setAction(Action::INDEX)->generateUrl());
    }
}
