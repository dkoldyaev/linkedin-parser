<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\ApprovedCV;
use App\Entity\Vacancy;
use App\Entity\VacancyCVAnalysis;
use App\Service\Llm\LlmManager;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Attribute\AdminRoute;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\UrlField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\BooleanFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\ChoiceFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\EntityFilter;
use EasyCorp\Bundle\EasyAdminBundle\Router\AdminUrlGenerator;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Serializer\SerializerInterface;

class VacancyCrudController extends AbstractCrudController
{
    private AdminUrlGenerator $adminUrlGenerator;
    private LlmManager $llmManager;
    private MercurePublisherService $mercure;
    private SerializerInterface $serializer;

    public function __construct(
        AdminUrlGenerator $adminUrlGenerator,
        LlmManager $llmManager,
        MercurePublisherService $mercure,
        SerializerInterface $serializer
    ) {
        $this->adminUrlGenerator = $adminUrlGenerator;
        $this->llmManager = $llmManager;
        $this->mercure = $mercure;
        $this->serializer = $serializer;
    }

    public static function getEntityFqcn(): string
    {
        return Vacancy::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Вакансия')
            ->setEntityLabelInPlural('Вакансии')
            ->setDefaultSort(['id' => 'DESC']);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(ChoiceFilter::new('status')->setChoices([
                'Еще не написал' => Vacancy::STATUS_NOT_CONTACTED,
                'Написал' => Vacancy::STATUS_CONTACTED,
                'Собеседование' => Vacancy::STATUS_INTERVIEW,
                'Тестовое' => Vacancy::STATUS_ASSESSMENT,
                'Оффер' => Vacancy::STATUS_OFFER,
                'Отказ' => Vacancy::STATUS_REJECTED,
            ]))
            ->add(BooleanFilter::new('isClosed', 'Закрыта'))
            ->add(EntityFilter::new('user', 'Пользователь'));
    }

    public function configureActions(Actions $actions): Actions
    {
        $rescoreAction = Action::new('rescore', 'Перезапустить скоринг', 'fa fa-brain')
            ->linkToCrudAction('rescoreVacancy');

        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->add(Crud::PAGE_INDEX, $rescoreAction)
            ->add(Crud::PAGE_DETAIL, $rescoreAction);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id', 'ID')->hideOnForm();
        yield AssociationField::new('user', 'Пользователь');
        yield TextField::new('title', 'Должность');
        yield TextField::new('company', 'Компания');
        yield ChoiceField::new('status', 'Статус')->setChoices([
            'Еще не написал' => Vacancy::STATUS_NOT_CONTACTED,
            'Написал' => Vacancy::STATUS_CONTACTED,
            'Собеседование' => Vacancy::STATUS_INTERVIEW,
            'Тестовое' => Vacancy::STATUS_ASSESSMENT,
            'Оффер' => Vacancy::STATUS_OFFER,
            'Отказ' => Vacancy::STATUS_REJECTED,
        ]);
        yield NumberField::new('matchScore', 'Совместимость (%)');
        yield BooleanField::new('isClosed', 'Закрыта');
        yield ChoiceField::new('workplaceType', 'Формат')->setChoices([
            'Удаленно' => 'remote',
            'Гибрид' => 'hybrid',
            'Офис' => 'on-site',
        ]);
        yield TextField::new('location', 'Локация');
        yield TextField::new('city', 'Город')->hideOnIndex();
        yield TextField::new('country', 'Страна')->hideOnIndex();
        yield NumberField::new('salaryMin', 'З/П от')->hideOnIndex();
        yield NumberField::new('salaryMax', 'З/П до')->hideOnIndex();
        yield TextField::new('salaryCurrency', 'Валюта')->hideOnIndex();
        yield TextField::new('salaryPeriod', 'Период З/П')->hideOnIndex();
        yield UrlField::new('url', 'Ссылка')->hideOnIndex();
        yield TextField::new('jobId', 'Job ID')->hideOnIndex();
        yield TextField::new('source', 'Источник')->hideOnIndex();
        yield ArrayField::new('tags', 'Теги')->hideOnIndex();
        yield ArrayField::new('techStack', 'Техстек')->hideOnIndex();
        yield TextareaField::new('aiSummary', 'AI Резюме')->hideOnIndex();
        yield TextareaField::new('description', 'Описание')->hideOnIndex();
        yield TextareaField::new('notes', 'Заметки')->hideOnIndex();
        yield TextareaField::new('companyInfo', 'О компании')->hideOnIndex();
        yield DateTimeField::new('createdAt', 'Создана')->hideOnForm();
        yield DateTimeField::new('updatedAt', 'Обновлена')->hideOnForm();
    }

    #[AdminRoute]
    public function rescoreVacancy(AdminContext $context, EntityManagerInterface $em): Response
    {
        /** @var Vacancy $vacancy */
        $vacancy = $context->getEntity()->getInstance();
        $user = $vacancy->getUser();

        $cvContent = 'Senior Full Stack Software Engineer';
        $cvRevision = 1;
        if ($user !== null) {
            $approvedCv = $em->getRepository(ApprovedCV::class)->findOneBy(['user' => $user]);
            if ($approvedCv !== null) {
                $cvContent = $approvedCv->getContent();
                $cvRevision = $approvedCv->getRevision();
            }
        }

        $provider = $this->llmManager->getDefaultProvider();
        $textToEvaluate = $vacancy->getDescription() ?? ($vacancy->getAiSummary() ?? $vacancy->getTitle());
        $compatResult = $provider->evaluateCompatibility(
            $textToEvaluate,
            $cvContent,
            'ru',
            []
        );

        $overallScore = (float)($compatResult['overallScore'] ?? 80.0);
        $vacancy->setMatchScore($overallScore);
        $vacancy->setUpdatedAt(new \DateTimeImmutable());

        if ($user !== null) {
            $analysis = new VacancyCVAnalysis(
                $user,
                $vacancy,
                $cvRevision,
                'v1.0',
                $provider->getName(),
                $overallScore,
                $compatResult,
                null,
                new \DateTimeImmutable()
            );
            $em->persist($analysis);
        }

        $em->flush();

        // Broadcast update via Mercure
        $topic = $user !== null ? sprintf('vacancies:%d', $user->getId()) : MercurePublisherService::DEFAULT_TOPIC;
        $json = $this->serializer->serialize($vacancy, 'json', ['groups' => ['vacancy:read']]);
        $payload = json_decode($json, true) ?? [];
        $this->mercure->publish(
            $topic,
            MercurePublisherService::EVENT_VACANCY_UPDATED,
            MercurePublisherService::MSG_VACANCY_UPDATED,
            [
                'vacancy' => $payload,
                'vacancy_id' => $vacancy->getId(),
                'title' => $vacancy->getTitle(),
                'match_score' => $overallScore,
                'data' => $payload,
            ]
        );

        $this->addFlash('success', sprintf('Скоринг вакансии "%s" успешно обновлен: %d%%', $vacancy->getTitle(), (int)$overallScore));

        return $this->redirect($this->adminUrlGenerator->setAction(Action::INDEX)->generateUrl());
    }
}
