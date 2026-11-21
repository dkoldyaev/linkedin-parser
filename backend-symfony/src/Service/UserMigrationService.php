<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ApprovedCV;
use App\Entity\ProcessingQueueItem;
use App\Entity\User;
use App\Entity\UserSetting;
use App\Entity\Vacancy;
use App\Entity\VacancyCVAnalysis;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class UserMigrationService
{
    private EntityManagerInterface $entityManager;
    private LoggerInterface $logger;

    public function __construct(EntityManagerInterface $entityManager, LoggerInterface $logger)
    {
        $this->entityManager = $entityManager;
        $this->logger = $logger;
    }

    public function migrateAnonymousUserData(User $anonUser, User $targetUser): void
    {
        if ($anonUser->getId() === null || $targetUser->getId() === null) {
            return;
        }

        if ($anonUser->getId() === $targetUser->getId()) {
            return;
        }

        $this->logger->info(sprintf(
            'Migrating anonymous user %d (%s) data to user %d (%s)',
            (int)$anonUser->getId(),
            $anonUser->getEmail(),
            (int)$targetUser->getId(),
            $targetUser->getEmail()
        ));

        // 1. Vacancies
        $vacancies = $this->entityManager->getRepository(Vacancy::class)->findBy(['user' => $anonUser]);
        foreach ($vacancies as $vacancy) {
            $vacancy->setUser($targetUser);
        }

        // 2. Transfer last_board_interaction_at if anonymous user interacted more recently
        if ($anonUser->getLastBoardInteractionAt() !== null) {
            $targetInteraction = $targetUser->getLastBoardInteractionAt();
            if ($targetInteraction === null || $anonUser->getLastBoardInteractionAt() > $targetInteraction) {
                $targetUser->setLastBoardInteractionAt($anonUser->getLastBoardInteractionAt());
            }
        }

        // 3. ApprovedCV
        $anonCv = $this->entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $anonUser]);
        if ($anonCv !== null) {
            $targetCv = $this->entityManager->getRepository(ApprovedCV::class)->findOneBy(['user' => $targetUser]);
            if ($targetCv === null) {
                $anonCv->setUser($targetUser);
            } else {
                $this->entityManager->remove($anonCv);
            }
        }

        // 4. VacancyCVAnalysis
        $anonAnalyses = $this->entityManager->getRepository(VacancyCVAnalysis::class)->findBy(['user' => $anonUser]);
        foreach ($anonAnalyses as $analysis) {
            $vacancy = $analysis->getVacancy();
            $existing = null;
            if ($vacancy !== null) {
                $existing = $this->entityManager->getRepository(VacancyCVAnalysis::class)->findOneBy([
                    'user' => $targetUser,
                    'vacancy' => $vacancy,
                ]);
            }
            if ($existing === null) {
                $analysis->setUser($targetUser);
            } else {
                $this->entityManager->remove($analysis);
            }
        }

        // 5. UserSetting
        $anonSettings = $this->entityManager->getRepository(UserSetting::class)->findBy(['user' => $anonUser]);
        foreach ($anonSettings as $setting) {
            $existing = $this->entityManager->getRepository(UserSetting::class)->findOneBy([
                'user' => $targetUser,
                'key' => $setting->getKey(),
            ]);
            if ($existing === null) {
                $setting->setUser($targetUser);
            } else {
                $this->entityManager->remove($setting);
            }
        }

        // 6. ProcessingQueueItem
        $anonQueueItems = $this->entityManager->getRepository(ProcessingQueueItem::class)->findBy(['user' => $anonUser]);
        foreach ($anonQueueItems as $item) {
            $item->setUser($targetUser);
        }

        $this->entityManager->flush();

        // 7. Remove anonymous user record
        try {
            $this->entityManager->remove($anonUser);
            $this->entityManager->flush();
            $this->logger->info(sprintf(
                'Successfully migrated and removed anonymous user %d',
                (int)$anonUser->getId()
            ));
        } catch (\Throwable $e) {
            $this->logger->error(sprintf('Error finalizing anonymous user deletion: %s', $e->getMessage()), [
                'exception' => $e,
            ]);
        }
    }
}
