<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'api_keys')]
#[ApiResource(
    operations: [
        new GetCollection(normalizationContext: ['groups' => ['apikey:read']]),
        new Get(normalizationContext: ['groups' => ['apikey:read']]),
        new Post(normalizationContext: ['groups' => ['apikey:read']], denormalizationContext: ['groups' => ['apikey:write']]),
        new Delete(),
    ]
)]
class ApiKey implements UserOwnedInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['apikey:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'apiKeys')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(name: 'key_hash', type: Types::STRING, length: 64, unique: true)]
    private string $keyHash;

    #[ORM\Column(type: Types::STRING, length: 128)]
    #[Groups(['apikey:read', 'apikey:write'])]
    private string $name;

    #[ORM\Column(type: Types::STRING, length: 16)]
    #[Groups(['apikey:read'])]
    private string $prefix;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['apikey:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'last_used_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['apikey:read'])]
    private ?\DateTimeImmutable $lastUsedAt = null;

    #[ORM\Column(name: 'request_count', type: Types::INTEGER, options: ['default' => 0])]
    #[Groups(['apikey:read'])]
    private int $requestCount = 0;

    public function __construct(
        User $user,
        string $keyHash,
        string $name,
        string $prefix,
        \DateTimeImmutable $createdAt
    ) {
        $this->user = $user;
        $this->keyHash = $keyHash;
        $this->name = $name;
        $this->prefix = $prefix;
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

    public function getKeyHash(): string
    {
        return $this->keyHash;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getPrefix(): string
    {
        return $this->prefix;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getLastUsedAt(): ?\DateTimeImmutable
    {
        return $this->lastUsedAt;
    }

    public function setLastUsedAt(?\DateTimeImmutable $lastUsedAt): self
    {
        $this->lastUsedAt = $lastUsedAt;
        return $this;
    }

    public function getRequestCount(): int
    {
        return $this->requestCount;
    }

    public function setRequestCount(int $requestCount): self
    {
        $this->requestCount = $requestCount;
        return $this;
    }
}
