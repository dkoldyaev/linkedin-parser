<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\UserLLMTokenUsage;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\ChoiceFilter;
use EasyCorp\Bundle\EasyAdminBundle\Filter\EntityFilter;

class UserLLMTokenUsageCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return UserLLMTokenUsage::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Запись использования LLM')
            ->setEntityLabelInPlural('Токены LLM')
            ->setDefaultSort(['id' => 'DESC']);
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters
            ->add(EntityFilter::new('user', 'Пользователь'))
            ->add(ChoiceFilter::new('provider')->setChoices([
                'Gemini' => 'gemini',
                'Mistral' => 'mistral',
                'OpenAI' => 'openai',
                'Mock' => 'mock',
            ]));
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions
            ->disable(Action::NEW, Action::EDIT, Action::DELETE)
            ->add(Crud::PAGE_INDEX, Action::DETAIL);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id', 'ID');
        yield AssociationField::new('user', 'Пользователь');
        yield TextField::new('provider', 'Провайдер');
        yield TextField::new('model', 'Модель');
        yield IntegerField::new('promptTokens', 'Prompt Токены');
        yield IntegerField::new('completionTokens', 'Completion Токены');
        yield IntegerField::new('totalTokens', 'Всего Токенов');
        yield DateTimeField::new('createdAt', 'Время запроса');
    }
}
