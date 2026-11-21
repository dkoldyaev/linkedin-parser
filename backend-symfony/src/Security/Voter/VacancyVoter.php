<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\User;
use App\Entity\Vacancy;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class VacancyVoter extends Voter
{
    public const VIEW = 'VACANCY_VIEW';
    public const EDIT = 'VACANCY_EDIT';
    public const DELETE = 'VACANCY_DELETE';

    private Security $security;

    public function __construct(Security $security)
    {
        $this->security = $security;
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)
            && $subject instanceof Vacancy;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        if ($this->security->isGranted('ROLE_ADMIN')) {
            return true;
        }

        /** @var Vacancy $vacancy */
        $vacancy = $subject;

        if ($vacancy->getUser() === null) {
            return false;
        }

        return $vacancy->getUser()->getId() === $user->getId();
    }
}
