<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\VacancyRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: VacancyRepository::class)]
#[ORM\Table(name: 'vacancies')]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(name: 'ix_vacancies_user_updated', columns: ['user_id', 'updated_at', 'id'])]
#[ORM\Index(name: 'ix_vacancies_user_created', columns: ['user_id', 'created_at'])]
#[ORM\Index(name: 'ix_vacancies_user_job', columns: ['user_id', 'job_id'])]
#[ORM\Index(name: 'ix_vacancies_user_url', columns: ['user_id', 'url'])]
#[ApiResource(
    operations: [
        new GetCollection(
            normalizationContext: ['groups' => ['vacancy:read']],
            order: ['updatedAt' => 'DESC', 'id' => 'DESC']
        ),
        new Get(normalizationContext: ['groups' => ['vacancy:read', 'vacancy:detail']]),
        new Post(status: 200, normalizationContext: ['groups' => ['vacancy:read']], denormalizationContext: ['groups' => ['vacancy:write']]),
        new Patch(
            inputFormats: ['json' => ['application/merge-patch+json', 'application/json']],
            normalizationContext: ['groups' => ['vacancy:read']],
            denormalizationContext: ['groups' => ['vacancy:write']]
        ),
        new Delete(),
    ],
    order: ['updatedAt' => 'DESC', 'id' => 'DESC'],
    normalizationContext: ['groups' => ['vacancy:read']],
    denormalizationContext: ['groups' => ['vacancy:write']]
)]
class Vacancy implements UserOwnedInterface
{
    public const STATUS_NOT_CONTACTED = "Еще не написал";
    public const STATUS_CONTACTED = "Написал";
    public const STATUS_INTERVIEW = "Собеседование";
    public const STATUS_ASSESSMENT = "Тестовое";
    public const STATUS_OFFER = "Оффер";
    public const STATUS_REJECTED = "Отказ";

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['vacancy:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'vacancies')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(name: 'job_id', type: Types::STRING, length: 64, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $jobId = null;

    #[ORM\Column(type: Types::STRING, length: 1024)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private string $url;

    #[ORM\Column(type: Types::STRING, length: 256)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private string $title;

    #[ORM\Column(type: Types::STRING, length: 256)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private string $company;

    #[ORM\Column(name: 'company_url', type: Types::STRING, length: 1024, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $companyUrl = null;

    #[ORM\Column(name: 'company_info', type: Types::TEXT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $companyInfo = null;

    #[ORM\Column(type: Types::STRING, length: 64, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $source = null;

    #[ORM\Column(type: Types::STRING, length: 256, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $location = null;

    #[ORM\Column(type: Types::STRING, length: 128, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $city = null;

    #[ORM\Column(type: Types::STRING, length: 128, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $country = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $description = null;

    #[ORM\Column(name: 'workplace_type', type: Types::STRING, length: 32, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $workplaceType = null;

    #[ORM\Column(name: 'is_closed', type: Types::BOOLEAN)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private bool $isClosed;

    #[ORM\Column(name: 'salary_min', type: Types::FLOAT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?float $salaryMin = null;

    #[ORM\Column(name: 'salary_max', type: Types::FLOAT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?float $salaryMax = null;

    #[ORM\Column(name: 'salary_currency', type: Types::STRING, length: 16, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $salaryCurrency = null;

    #[ORM\Column(name: 'salary_period', type: Types::STRING, length: 32, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $salaryPeriod = null;

    #[ORM\Column(name: 'ai_summary', type: Types::TEXT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $aiSummary = null;

    /**
     * @var list<string>
     */
    #[ORM\Column(name: 'tech_stack', type: Types::JSON)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private array $techStack = [];

    /**
     * @var array<string, mixed>|null
     */
    #[ORM\Column(name: 'extracted_requirements', type: Types::JSON, nullable: true)]
    #[Groups(['vacancy:write'])]
    private ?array $extractedRequirements = null;

    #[ORM\Column(name: 'match_score', type: Types::FLOAT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?float $matchScore = null;

    #[ORM\Column(type: Types::STRING, length: 64)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private string $status;

    /**
     * @var list<string>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private array $tags = [];

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private int $lane;

    #[ORM\Column(name: 'sort_order', type: Types::FLOAT, nullable: true)]
    #[Groups(['vacancy:read', 'vacancy:write'])]
    private ?float $sortOrder = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['vacancy:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['vacancy:read'])]
    private \DateTimeImmutable $updatedAt;

    /**
     * @var Collection<int, VacancyStatusHistory>
     */
    #[ORM\OneToMany(targetEntity: VacancyStatusHistory::class, mappedBy: 'vacancy', cascade: ['remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    #[Groups(['vacancy:read', 'vacancy:detail'])]
    private Collection $history;

    public function __construct()
    {
        $this->url = '';
        $this->title = '';
        $this->company = '';
        $this->status = self::STATUS_NOT_CONTACTED;
        $this->isClosed = false;
        $this->lane = 0;
        $this->techStack = [];
        $this->tags = [];
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->history = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    #[Groups(['vacancy:read'])]
    public function getUserId(): ?int
    {
        return $this->user !== null ? $this->user->getId() : null;
    }

    #[Groups(['vacancy:read'])]
    public function getCalculatedScore(): ?float
    {
        return $this->matchScore;
    }

    #[Groups(['vacancy:read'])]
    public function getCompatibility(): mixed
    {
        return null;
    }

    #[Groups(['vacancy:read'])]
    public function getStage(): ?string
    {
        return null;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    private bool $manuallyMoved = false;

    public function markManuallyMoved(): self
    {
        $this->manuallyMoved = true;
        return $this;
    }

    public function isManuallyMoved(): bool
    {
        return $this->manuallyMoved;
    }

    public function getJobId(): ?string
    {
        return $this->jobId;
    }

    public function setJobId(?string $jobId): self
    {
        $this->jobId = ($jobId !== null && mb_strlen($jobId) > 64) ? mb_substr($jobId, 0, 64) : $jobId;
        return $this;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function setUrl(string $url): self
    {
        $this->url = mb_strlen($url) > 1024 ? mb_substr($url, 0, 1024) : $url;
        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = mb_strlen($title) > 255 ? mb_substr($title, 0, 255) : $title;
        return $this;
    }

    public function getCompany(): string
    {
        return $this->company;
    }

    public function setCompany(string $company): self
    {
        $this->company = mb_strlen($company) > 255 ? mb_substr($company, 0, 255) : $company;
        return $this;
    }

    public function getCompanyUrl(): ?string
    {
        return $this->companyUrl;
    }

    public function setCompanyUrl(?string $companyUrl): self
    {
        $this->companyUrl = ($companyUrl !== null && mb_strlen($companyUrl) > 1024) ? mb_substr($companyUrl, 0, 1024) : $companyUrl;
        return $this;
    }

    public function getCompanyInfo(): ?string
    {
        return $this->companyInfo;
    }

    public function setCompanyInfo(?string $companyInfo): self
    {
        $this->companyInfo = $companyInfo;
        return $this;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(?string $source): self
    {
        $this->source = ($source !== null && mb_strlen($source) > 64) ? mb_substr($source, 0, 64) : $source;
        return $this;
    }

    public function getLocation(): ?string
    {
        return $this->location;
    }

    public function setLocation(?string $location): self
    {
        $this->location = ($location !== null && mb_strlen($location) > 255) ? mb_substr($location, 0, 255) : $location;
        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): self
    {
        $this->city = ($city !== null && mb_strlen($city) > 128) ? mb_substr($city, 0, 128) : $city;
        return $this;
    }

    public function getCountry(): ?string
    {
        return $this->country;
    }

    public function setCountry(?string $country): self
    {
        $this->country = ($country !== null && mb_strlen($country) > 128) ? mb_substr($country, 0, 128) : $country;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getWorkplaceType(): ?string
    {
        return $this->workplaceType;
    }

    public function setWorkplaceType(?string $workplaceType): self
    {
        $this->workplaceType = ($workplaceType !== null && mb_strlen($workplaceType) > 64) ? mb_substr($workplaceType, 0, 64) : $workplaceType;
        return $this;
    }

    public function isClosed(): bool
    {
        return $this->isClosed;
    }

    #[Groups(['vacancy:read'])]
    public function getIsClosed(): bool
    {
        return $this->isClosed;
    }

    public function setIsClosed(bool $isClosed): self
    {
        $this->isClosed = $isClosed;
        return $this;
    }

    public function getSalaryMin(): ?float
    {
        return $this->salaryMin;
    }

    public function setSalaryMin(?float $salaryMin): self
    {
        $this->salaryMin = $salaryMin;
        return $this;
    }

    public function getSalaryMax(): ?float
    {
        return $this->salaryMax;
    }

    public function setSalaryMax(?float $salaryMax): self
    {
        $this->salaryMax = $salaryMax;
        return $this;
    }

    public function getSalaryCurrency(): ?string
    {
        return $this->salaryCurrency;
    }

    public function setSalaryCurrency(?string $salaryCurrency): self
    {
        $this->salaryCurrency = ($salaryCurrency !== null && mb_strlen($salaryCurrency) > 32) ? mb_substr($salaryCurrency, 0, 32) : $salaryCurrency;
        return $this;
    }

    public function getSalaryPeriod(): ?string
    {
        return $this->salaryPeriod;
    }

    public function setSalaryPeriod(?string $salaryPeriod): self
    {
        $this->salaryPeriod = ($salaryPeriod !== null && mb_strlen($salaryPeriod) > 32) ? mb_substr($salaryPeriod, 0, 32) : $salaryPeriod;
        return $this;
    }

    public function getAiSummary(): ?string
    {
        return $this->aiSummary;
    }

    public function setAiSummary(?string $aiSummary): self
    {
        $this->aiSummary = $aiSummary;
        return $this;
    }

    /**
     * @return list<string>
     */
    public function getTechStack(): array
    {
        return $this->techStack;
    }

    /**
     * @param list<string> $techStack
     */
    public function setTechStack(array $techStack): self
    {
        $this->techStack = $techStack;
        return $this;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getExtractedRequirements(): ?array
    {
        return $this->extractedRequirements;
    }

    /**
     * @param array<string, mixed>|null $extractedRequirements
     */
    public function setExtractedRequirements(?array $extractedRequirements): self
    {
        $this->extractedRequirements = $extractedRequirements;
        return $this;
    }

    public function getMatchScore(): ?float
    {
        return $this->matchScore;
    }

    public function setMatchScore(?float $matchScore): self
    {
        $this->matchScore = $matchScore;
        return $this;
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

    /**
     * @return list<string>
     */
    public function getTags(): array
    {
        return $this->tags;
    }

    /**
     * @param list<string> $tags
     */
    public function setTags(array $tags): self
    {
        $this->tags = $tags;
        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): self
    {
        $this->notes = $notes;
        return $this;
    }

    public function getLane(): int
    {
        return $this->lane;
    }

    public function setLane(int $lane): self
    {
        $this->lane = $lane;
        return $this;
    }

    public function getSortOrder(): ?float
    {
        return $this->sortOrder;
    }

    public function setSortOrder(?float $sortOrder): self
    {
        $this->sortOrder = $sortOrder;
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

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    /**
     * @return Collection<int, VacancyStatusHistory>
     */
    public function getHistory(): Collection
    {
        return $this->history;
    }
}
