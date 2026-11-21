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
#[ORM\Table(name: 'exchange_rates')]
#[ORM\UniqueConstraint(name: 'uq_exchange_rates_source_target', columns: ['source_currency', 'target_currency'])]
#[ApiResource(
    operations: [
        new GetCollection(normalizationContext: ['groups' => ['rate:read']]),
        new Get(normalizationContext: ['groups' => ['rate:read']]),
    ]
)]
class ExchangeRate
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['rate:read'])]
    private ?int $id = null;

    #[ORM\Column(name: 'source_currency', type: Types::STRING, length: 16)]
    #[Groups(['rate:read'])]
    private string $sourceCurrency;

    #[ORM\Column(name: 'target_currency', type: Types::STRING, length: 16)]
    #[Groups(['rate:read'])]
    private string $targetCurrency;

    #[ORM\Column(type: Types::FLOAT)]
    #[Groups(['rate:read'])]
    private float $rate;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['rate:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct(
        string $sourceCurrency,
        string $targetCurrency,
        float $rate,
        \DateTimeImmutable $updatedAt
    ) {
        $this->sourceCurrency = $sourceCurrency;
        $this->targetCurrency = $targetCurrency;
        $this->rate = $rate;
        $this->updatedAt = $updatedAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSourceCurrency(): string
    {
        return $this->sourceCurrency;
    }

    public function getTargetCurrency(): string
    {
        return $this->targetCurrency;
    }

    public function getRate(): float
    {
        return $this->rate;
    }

    public function setRate(float $rate): self
    {
        $this->rate = $rate;
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
