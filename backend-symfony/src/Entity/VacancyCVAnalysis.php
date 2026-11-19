<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'vacancy_cv_analyses')]
class VacancyCVAnalysis implements UserOwnedInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['analysis:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Vacancy::class)]
    #[ORM\JoinColumn(name: 'vacancy_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Vacancy $vacancy;

    #[ORM\Column(name: 'cv_revision', type: Types::INTEGER)]
    #[Groups(['analysis:read'])]
    private int $cvRevision;

    #[ORM\Column(name: 'scoring_policy_version', type: Types::STRING, length: 32)]
    #[Groups(['analysis:read'])]
    private string $scoringPolicyVersion;

    #[ORM\Column(name: 'model_id', type: Types::STRING, length: 128)]
    #[Groups(['analysis:read'])]
    private string $modelId;

    #[ORM\Column(name: 'overall_score', type: Types::FLOAT)]
    #[Groups(['analysis:read'])]
    private float $overallScore;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['analysis:read'])]
    private array $result;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(name: 'adapted_cv', type: Types::JSON, nullable: true)]
    #[Groups(['analysis:read'])]
    private ?array $adaptedCv = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['analysis:read'])]
    private \DateTimeImmutable $createdAt;

    /**
     * @param array<string, mixed> $result
     * @param array<string, mixed>|null $adaptedCv
     */
    public function __construct(
        User $user,
        Vacancy $vacancy,
        int $cvRevision,
        string $scoringPolicyVersion,
        string $modelId,
        float $overallScore,
        array $result,
        ?array $adaptedCv,
        \DateTimeImmutable $now
    ) {
        $this->user = $user;
        $this->vacancy = $vacancy;
        $this->cvRevision = $cvRevision;
        $this->scoringPolicyVersion = $scoringPolicyVersion;
        $this->modelId = $modelId;
        $this->overallScore = $overallScore;
        $this->result = $result;
        $this->adaptedCv = $adaptedCv;
        $this->createdAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        if ($user !== null) {
            $this->user = $user;
        }
        return $this;
    }

    public function getVacancy(): Vacancy
    {
        return $this->vacancy;
    }

    public function getCvRevision(): int
    {
        return $this->cvRevision;
    }

    public function getScoringPolicyVersion(): string
    {
        return $this->scoringPolicyVersion;
    }

    public function getModelId(): string
    {
        return $this->modelId;
    }

    public function getOverallScore(): float
    {
        return $this->overallScore;
    }

    /**
     * @return array<string, mixed>
     */
    public function getResult(): array
    {
        return $this->result;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getAdaptedCv(): ?array
    {
        return $this->adaptedCv;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
