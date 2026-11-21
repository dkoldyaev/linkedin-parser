<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'vacancy_status_history')]
#[ORM\Index(name: 'ix_history_vacancy_created', columns: ['vacancy_id', 'created_at'])]
class VacancyStatusHistory
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vacancy::class, inversedBy: 'history')]
    #[ORM\JoinColumn(name: 'vacancy_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Vacancy $vacancy;

    #[ORM\Column(name: 'from_status', type: Types::STRING, length: 64, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private ?string $fromStatus = null;

    #[ORM\Column(name: 'to_status', type: Types::STRING, length: 64)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private string $toStatus;

    #[ORM\Column(name: 'from_lane', type: Types::INTEGER, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private ?int $fromLane = null;

    #[ORM\Column(name: 'to_lane', type: Types::INTEGER, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private ?int $toLane = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private ?string $comment = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct(
        Vacancy $vacancy,
        ?string $fromStatus,
        string $toStatus,
        ?int $fromLane,
        ?int $toLane,
        ?string $comment,
        \DateTimeImmutable $now
    ) {
        $this->vacancy = $vacancy;
        $this->fromStatus = $fromStatus;
        $this->toStatus = $toStatus;
        $this->fromLane = $fromLane;
        $this->toLane = $toLane;
        $this->comment = $comment;
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    #[Groups(['vacancy:read', 'vacancy:detail'])]
    public function getVacancyId(): int
    {
        return $this->vacancy->getId();
    }

    public function getVacancy(): Vacancy
    {
        return $this->vacancy;
    }

    public function getFromStatus(): ?string
    {
        return $this->fromStatus;
    }

    public function getToStatus(): string
    {
        return $this->toStatus;
    }

    public function getFromLane(): ?int
    {
        return $this->fromLane;
    }

    public function getToLane(): ?int
    {
        return $this->toLane;
    }

    public function getComment(): ?string
    {
        return $this->comment;
    }

    public function setComment(?string $comment): self
    {
        $this->comment = $comment;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }
}
