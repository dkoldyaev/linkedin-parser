<?php

declare(strict_types=1);

namespace App\MessageHandler;

use App\Message\ScoreVacancyMessage;
use App\Service\VacancyScoringService;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
class ScoreVacancyHandler
{
    private VacancyScoringService $scoringService;

    public function __construct(VacancyScoringService $scoringService)
    {
        $this->scoringService = $scoringService;
    }

    public function __invoke(ScoreVacancyMessage $message): void
    {
        $this->scoringService->handleScoreMessage($message->getVacancyId(), $message->getUserId(), $message->isForce());
    }
}
