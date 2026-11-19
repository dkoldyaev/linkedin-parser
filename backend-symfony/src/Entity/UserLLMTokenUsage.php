<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'user_llm_token_usage')]
class UserLLMTokenUsage implements UserOwnedInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['usage:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'tokenUsages')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(type: Types::STRING, length: 32)]
    #[Groups(['usage:read'])]
    private string $provider;

    #[ORM\Column(type: Types::STRING, length: 64)]
    #[Groups(['usage:read'])]
    private string $model;

    #[ORM\Column(name: 'prompt_tokens', type: Types::INTEGER)]
    #[Groups(['usage:read'])]
    private int $promptTokens;

    #[ORM\Column(name: 'completion_tokens', type: Types::INTEGER)]
    #[Groups(['usage:read'])]
    private int $completionTokens;

    #[ORM\Column(name: 'total_tokens', type: Types::INTEGER)]
    #[Groups(['usage:read'])]
    private int $totalTokens;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['usage:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct(
        User $user,
        string $provider,
        string $model,
        int $promptTokens,
        int $completionTokens,
        int $totalTokens,
        \DateTimeImmutable $createdAt
    ) {
        $this->user = $user;
        $this->provider = $provider;
        $this->model = $model;
        $this->promptTokens = $promptTokens;
        $this->completionTokens = $completionTokens;
        $this->totalTokens = $totalTokens;
        $this->createdAt = $createdAt;
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

    public function getProvider(): string
    {
        return $this->provider;
    }

    public function getModel(): string
    {
        return $this->model;
    }

    public function getPromptTokens(): int
    {
        return $this->promptTokens;
    }

    public function getCompletionTokens(): int
    {
        return $this->completionTokens;
    }

    public function getTotalTokens(): int
    {
        return $this->totalTokens;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
