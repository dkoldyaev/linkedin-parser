<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'approved_cvs')]
#[ORM\UniqueConstraint(name: 'uq_user_approved_cv', columns: ['user_id'])]
#[ApiResource(
    operations: [
        new Get(normalizationContext: ['groups' => ['cv:read']]),
        new Post(normalizationContext: ['groups' => ['cv:read']], denormalizationContext: ['groups' => ['cv:write']]),
        new Delete(),
    ]
)]
class ApprovedCV implements UserOwnedInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['cv:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    #[Groups(['cv:read'])]
    private User $user;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['cv:read', 'cv:write'])]
    private string $content;

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(name: 'parsed_profile', type: Types::JSON, nullable: true)]
    #[Groups(['cv:read', 'cv:write'])]
    private ?array $parsedProfile = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['cv:read'])]
    private int $revision;

    #[ORM\Column(name: 'approved_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['cv:read'])]
    private \DateTimeImmutable $approvedAt;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['cv:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['cv:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct(
        User $user,
        string $content,
        ?array $parsedProfile,
        int $revision,
        \DateTimeImmutable $now
    ) {
        $this->user = $user;
        $this->content = $content;
        $this->parsedProfile = $parsedProfile;
        $this->revision = $revision;
        $this->approvedAt = $now;
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
        if ($user !== null) {
            $this->user = $user;
        }
        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): self
    {
        $this->content = $content;
        return $this;
    }

    public function getParsedProfile(): ?array
    {
        return $this->parsedProfile;
    }

    public function setParsedProfile(?array $parsedProfile): self
    {
        $this->parsedProfile = $parsedProfile;
        return $this;
    }

    public function getRevision(): int
    {
        return $this->revision;
    }

    public function setRevision(int $revision): self
    {
        $this->revision = $revision;
        return $this;
    }

    public function getApprovedAt(): \DateTimeImmutable
    {
        return $this->approvedAt;
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
