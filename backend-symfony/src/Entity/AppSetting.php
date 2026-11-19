<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'settings')]
#[ApiResource(
    operations: [
        new GetCollection(normalizationContext: ['groups' => ['setting:read']]),
        new Get(normalizationContext: ['groups' => ['setting:read']]),
        new Post(normalizationContext: ['groups' => ['setting:read']], denormalizationContext: ['groups' => ['setting:write']]),
    ]
)]
class AppSetting
{
    #[ORM\Id]
    #[ORM\Column(name: 'key', type: Types::STRING, length: 128)]
    #[Groups(['setting:read', 'setting:write'])]
    private string $key;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['setting:read', 'setting:write'])]
    private ?string $value = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['setting:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct(string $key, ?string $value, \DateTimeImmutable $updatedAt)
    {
        $this->key = $key;
        $this->value = $value;
        $this->updatedAt = $updatedAt;
    }

    public function getKey(): string
    {
        return $this->key;
    }

    public function getValue(): ?string
    {
        return $this->value;
    }

    public function setValue(?string $value): self
    {
        $this->value = $value;
        return $this;
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
