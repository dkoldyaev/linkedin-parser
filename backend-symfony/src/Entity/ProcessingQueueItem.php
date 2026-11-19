<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'processing_queue_items')]
#[ORM\Index(name: 'ix_queue_task_id', columns: ['task_id'])]
#[ORM\Index(name: 'ix_queue_user_status', columns: ['user_id', 'status'])]
#[ApiResource(
    operations: [
        new GetCollection(normalizationContext: ['groups' => ['queue:read']]),
        new Get(normalizationContext: ['groups' => ['queue:read']]),
    ]
)]
class ProcessingQueueItem implements UserOwnedInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['queue:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    #[Groups(['queue:read'])]
    private ?User $user = null;

    #[ORM\Column(name: 'task_id', type: Types::STRING, length: 64, unique: true)]
    #[Groups(['queue:read'])]
    private string $taskId;

    #[ORM\Column(type: Types::STRING, length: 1024)]
    #[Groups(['queue:read'])]
    private string $url;

    #[ORM\Column(type: Types::STRING, length: 32)]
    #[Groups(['queue:read'])]
    private string $status;

    #[ORM\Column(type: Types::STRING, length: 32, nullable: true)]
    #[Groups(['queue:read'])]
    private ?string $stage = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['queue:read'])]
    private int $attempts;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['queue:read'])]
    private ?string $error = null;

    #[ORM\Column(name: 'vacancy_id', type: Types::INTEGER, nullable: true)]
    #[Groups(['queue:read'])]
    private ?int $vacancyId = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['queue:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['queue:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct(
        string $taskId,
        string $url,
        string $status,
        ?string $stage,
        int $attempts,
        \DateTimeImmutable $now
    ) {
        $this->taskId = $taskId;
        $this->url = $url;
        $this->status = $status;
        $this->stage = $stage;
        $this->attempts = $attempts;
        $this->createdAt = $now;
        $this->updatedAt = $now;
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
        $this->user = $user;
        return $this;
    }

    public function getTaskId(): string
    {
        return $this->taskId;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getStage(): ?string
    {
        return $this->stage;
    }

    public function setStage(?string $stage): self
    {
        $this->stage = $stage;
        return $this;
    }

    public function getAttempts(): int
    {
        return $this->attempts;
    }

    public function setAttempts(int $attempts): self
    {
        $this->attempts = $attempts;
        return $this;
    }

    public function getError(): ?string
    {
        return $this->error;
    }

    public function setError(?string $error): self
    {
        $this->error = $error;
        return $this;
    }

    public function getVacancyId(): ?int
    {
        return $this->vacancyId;
    }

    public function setVacancyId(?int $vacancyId): self
    {
        $this->vacancyId = $vacancyId;
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
