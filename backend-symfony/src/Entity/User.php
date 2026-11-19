<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ApiResource(
    operations: [
        new Get(normalizationContext: ['groups' => ['user:read']]),
        new GetCollection(normalizationContext: ['groups' => ['user:read']]),
        new Patch(
            inputFormats: ['json' => ['application/merge-patch+json', 'application/json']],
            normalizationContext: ['groups' => ['user:read']],
            denormalizationContext: ['groups' => ['user:write']]
        ),
    ],
    security: "is_granted('ROLE_ADMIN')"
)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['user:read', 'vacancy:read'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::STRING, length: 255, unique: true)]
    #[Groups(['user:read'])]
    private string $email;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    private ?string $password = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::STRING, length: 1024, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $avatar = null;

    #[ORM\Column(name: 'is_admin', type: Types::BOOLEAN)]
    #[Groups(['user:read'])]
    private bool $isAdmin;

    /**
     * @var list<string>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['user:read'])]
    private array $roles = [];

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['user:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['user:read'])]
    private \DateTimeImmutable $updatedAt;

    /**
     * @var Collection<int, Vacancy>
     */
    #[ORM\OneToMany(targetEntity: Vacancy::class, mappedBy: 'user', cascade: ['remove'], orphanRemoval: true)]
    private Collection $vacancies;

    /**
     * @var Collection<int, UserFeatureFlag>
     */
    #[ORM\OneToMany(targetEntity: UserFeatureFlag::class, mappedBy: 'user', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $featureFlags;

    /**
     * @var Collection<int, UserSetting>
     */
    #[ORM\OneToMany(targetEntity: UserSetting::class, mappedBy: 'user', cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $settings;

    /**
     * @var Collection<int, ApiKey>
     */
    #[ORM\OneToMany(targetEntity: ApiKey::class, mappedBy: 'user', cascade: ['remove'], orphanRemoval: true)]
    private Collection $apiKeys;

    /**
     * @var Collection<int, UserLLMTokenUsage>
     */
    #[ORM\OneToMany(targetEntity: UserLLMTokenUsage::class, mappedBy: 'user', cascade: ['remove'], orphanRemoval: true)]
    private Collection $tokenUsages;

    #[ORM\Column(name: 'last_login_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $lastLoginAt = null;

    #[ORM\Column(name: 'last_board_interaction_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['user:read'])]
    private ?\DateTimeImmutable $lastBoardInteractionAt = null;

    #[ORM\Column(name: 'is_anonymous', type: Types::BOOLEAN)]
    #[Groups(['user:read'])]
    private bool $isAnonymous;

    public function __construct(string $email, ?string $name, ?string $avatar, bool $isAdmin, array $roles, \DateTimeImmutable $now)
    {
        $this->email = $email;
        $this->name = $name;
        $this->avatar = $avatar;
        $this->isAdmin = $isAdmin;
        $this->roles = $roles;
        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->isAnonymous = false;
        $this->vacancies = new ArrayCollection();
        $this->featureFlags = new ArrayCollection();
        $this->settings = new ArrayCollection();
        $this->apiKeys = new ArrayCollection();
        $this->tokenUsages = new ArrayCollection();
    }

    public function isAdmin(): bool
    {
        return $this->isAdmin;
    }

    public function setIsAdmin(bool $isAdmin): self
    {
        $this->isAdmin = $isAdmin;
        return $this;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): self
    {
        $this->avatar = $avatar;
        return $this;
    }

    public function getLastLoginAt(): ?\DateTimeImmutable
    {
        return $this->lastLoginAt;
    }

    public function setLastLoginAt(?\DateTimeImmutable $lastLoginAt): self
    {
        $this->lastLoginAt = $lastLoginAt;
        return $this;
    }

    public function getLastBoardInteractionAt(): ?\DateTimeImmutable
    {
        return $this->lastBoardInteractionAt;
    }

    public function setLastBoardInteractionAt(?\DateTimeImmutable $lastBoardInteractionAt): self
    {
        $this->lastBoardInteractionAt = $lastBoardInteractionAt;
        return $this;
    }

    public function isAnonymous(): bool
    {
        return $this->isAnonymous;
    }

    public function setIsAnonymous(bool $isAnonymous): self
    {
        $this->isAnonymous = $isAnonymous;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        if (!in_array('ROLE_USER', $roles, true)) {
            $roles[] = 'ROLE_USER';
        }
        if ($this->isAdmin && !in_array('ROLE_ADMIN', $roles, true)) {
            $roles[] = 'ROLE_ADMIN';
        }
        return array_values(array_unique($roles));
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): self
    {
        $this->roles = $roles;
        return $this;
    }

    public function eraseCredentials(): void
    {
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(?string $password): self
    {
        $this->password = $password;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;
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

    /**
     * @return Collection<int, Vacancy>
     */
    public function getVacancies(): Collection
    {
        return $this->vacancies;
    }

    /**
     * @return Collection<int, UserFeatureFlag>
     */
    public function getFeatureFlags(): Collection
    {
        return $this->featureFlags;
    }

    /**
     * @return Collection<int, UserSetting>
     */
    public function getSettings(): Collection
    {
        return $this->settings;
    }

    /**
     * @return Collection<int, ApiKey>
     */
    public function getApiKeys(): Collection
    {
        return $this->apiKeys;
    }

    /**
     * @return Collection<int, UserLLMTokenUsage>
     */
    public function getTokenUsages(): Collection
    {
        return $this->tokenUsages;
    }

    public function getTotalLlmTokens(): int
    {
        $sum = 0;
        foreach ($this->tokenUsages as $usage) {
            $sum += $usage->getTotalTokens();
        }
        return $sum;
    }

    public function getPromptLlmTokens(): int
    {
        $sum = 0;
        foreach ($this->tokenUsages as $usage) {
            $sum += $usage->getPromptTokens();
        }
        return $sum;
    }

    public function getCompletionLlmTokens(): int
    {
        $sum = 0;
        foreach ($this->tokenUsages as $usage) {
            $sum += $usage->getCompletionTokens();
        }
        return $sum;
    }

    public function getLlmUsageSummary(): string
    {
        $total = 0;
        $prompt = 0;
        $completion = 0;
        $byProvider = [];

        foreach ($this->tokenUsages as $usage) {
            $total += $usage->getTotalTokens();
            $prompt += $usage->getPromptTokens();
            $completion += $usage->getCompletionTokens();
            $prov = $usage->getProvider();
            if (!isset($byProvider[$prov])) {
                $byProvider[$prov] = 0;
            }
            $byProvider[$prov] += $usage->getTotalTokens();
        }

        if ($total === 0) {
            return '0 токенов';
        }

        $providerParts = [];
        foreach ($byProvider as $prov => $tokens) {
            $providerParts[] = sprintf('%s: %s', $prov, number_format((float)$tokens));
        }

        return sprintf(
            '%s токенов (Prompt: %s, Completion: %s) [%s]',
            number_format((float)$total),
            number_format((float)$prompt),
            number_format((float)$completion),
            implode(', ', $providerParts)
        );
    }

    public function getVacanciesCount(): int
    {
        return $this->vacancies->count();
    }

    /**
     * @return list<string>
     */
    public function getFlagsList(): array
    {
        $flags = [];
        foreach ($this->featureFlags as $f) {
            $flags[] = $f->getFlag();
        }
        return $flags;
    }

    /**
     * @param list<string> $flags
     */
    public function setFlagsList(array $flags): self
    {
        $existing = [];
        foreach ($this->featureFlags as $f) {
            $existing[$f->getFlag()] = $f;
        }

        $targetFlags = array_values(array_unique($flags));

        // Remove deleted flags
        foreach ($existing as $flagName => $flagEntity) {
            if (!in_array($flagName, $targetFlags, true)) {
                $this->featureFlags->removeElement($flagEntity);
            }
        }

        // Add new flags
        $now = new \DateTimeImmutable();
        foreach ($targetFlags as $flagName) {
            if (!isset($existing[$flagName])) {
                $flag = new UserFeatureFlag($this, (string)$flagName, $now);
                $this->featureFlags->add($flag);
            }
        }

        if (in_array('admin', $targetFlags, true)) {
            $this->isAdmin = true;
        }

        return $this;
    }

    public function __toString(): string
    {
        return $this->email . ($this->name !== null && $this->name !== '' ? ' (' . $this->name . ')' : '');
    }
}
