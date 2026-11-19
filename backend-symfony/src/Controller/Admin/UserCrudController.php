<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\User;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class UserCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return User::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Пользователь')
            ->setEntityLabelInPlural('Пользователи')
            ->setDefaultSort(['id' => 'ASC']);
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL);
    }

    public function configureFields(string $pageName): iterable
    {
        yield IdField::new('id', 'ID')->hideOnForm();
        yield TextField::new('email', 'Email');
        yield TextField::new('name', 'Имя');
        yield BooleanField::new('isAdmin', 'Администратор');
        yield ChoiceField::new('flagsList', 'Feature Flags')
            ->setChoices([
                'admin' => 'admin',
                'api_access' => 'api_access',
            ])
            ->allowMultipleChoices()
            ->renderExpanded();
        yield ArrayField::new('roles', 'Роли')->hideOnIndex();
        yield IntegerField::new('vacanciesCount', 'Вакансий')->hideOnForm();
        yield TextField::new('llmUsageSummary', 'Использование LLM (токены)')->hideOnForm();
        yield DateTimeField::new('createdAt', 'Создан')->hideOnForm();
        yield DateTimeField::new('updatedAt', 'Обновлен')->hideOnForm();
    }
}
