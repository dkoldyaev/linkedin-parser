<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\ExchangeRate;
use App\Entity\User;
use App\Entity\UserSetting;
use App\Entity\Vacancy;
use App\Entity\VacancyStatusHistory;
use App\Service\Mercure\MercurePublisherService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class MetadataController extends AbstractController
{
    private const BASE_STATUSES = ['Еще не написал', 'Отказ'];

    public const DEFAULT_COLUMNS = [
        ['id' => 'Еще не написал', 'color' => '#6366f1', 'has_lanes' => false, 'is_base' => true],
        ['id' => 'Написал', 'color' => '#0284c7', 'has_lanes' => false, 'is_base' => false],
        ['id' => 'Собеседование', 'color' => '#d97706', 'has_lanes' => true, 'is_base' => false],
        ['id' => 'Тестовое', 'color' => '#9333ea', 'has_lanes' => true, 'is_base' => false],
        ['id' => 'Оффер', 'color' => '#059669', 'has_lanes' => false, 'is_base' => false],
        ['id' => 'Отказ', 'color' => '#ef4444', 'has_lanes' => false, 'is_base' => true],
    ];

    #[Route('/api/v2/exchange-rates', name: 'api_v2_exchange_rates', methods: ['GET'])]
    public function exchangeRates(EntityManagerInterface $entityManager): JsonResponse
    {
        $rates = $entityManager->getRepository(ExchangeRate::class)->findAll();
        $ratesMap = [];
        $latest = null;
        foreach ($rates as $r) {
            $key = sprintf('%s_%s', $r->getSourceCurrency(), $r->getTargetCurrency());
            $ratesMap[$key] = $r->getRate();
            if ($latest === null || $r->getUpdatedAt() > $latest) {
                $latest = $r->getUpdatedAt();
            }
        }
        return new JsonResponse([
            'rates' => $ratesMap,
            'updated_at' => $latest !== null ? $latest->format(\DateTimeInterface::ATOM) : null,
        ]);
    }

    #[Route('/api/v1/tags', name: 'api_v1_tags', methods: ['GET'])]
    #[Route('/api/v2/tags', name: 'api_v2_tags', methods: ['GET'])]
    public function tags(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $vacancies = $entityManager->getRepository(Vacancy::class)->findBy(['user' => $user]);
        $tags = [];
        foreach ($vacancies as $vacancy) {
            foreach ($vacancy->getTags() as $tag) {
                $trimmed = trim((string)$tag);
                if ($trimmed !== '') {
                    $tags[$trimmed] = true;
                }
            }
        }

        $result = array_keys($tags);
        sort($result);
        return new JsonResponse($result);
    }

    #[Route('/api/v1/countries', name: 'api_v1_countries', methods: ['GET'])]
    #[Route('/api/v2/countries', name: 'api_v2_countries', methods: ['GET'])]
    public function countries(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $vacancies = $entityManager->getRepository(Vacancy::class)->findBy(['user' => $user]);
        $countries = [];
        foreach ($vacancies as $vacancy) {
            $c = $vacancy->getCountry();
            if ($c !== null && trim($c) !== '' && !in_array(strtolower(trim($c)), ['null', 'none', 'n/a'], true)) {
                $countries[trim($c)] = true;
            }
        }

        $result = array_keys($countries);
        sort($result);
        return new JsonResponse($result);
    }

    #[Route('/api/v1/cities', name: 'api_v1_cities', methods: ['GET'])]
    #[Route('/api/v2/cities', name: 'api_v2_cities', methods: ['GET'])]
    public function cities(Request $request, EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $countryFilter = $request->query->get('country');
        $vacancies = $entityManager->getRepository(Vacancy::class)->findBy(['user' => $user]);

        $cities = [];
        foreach ($vacancies as $vacancy) {
            if ($countryFilter !== null && trim($countryFilter) !== '') {
                if (strcasecmp((string)$vacancy->getCountry(), trim($countryFilter)) !== 0) {
                    continue;
                }
            }
            $c = $vacancy->getCity();
            if ($c !== null && trim($c) !== '' && !in_array(strtolower(trim($c)), ['null', 'none', 'n/a'], true)) {
                $cities[trim($c)] = true;
            }
        }

        $result = array_keys($cities);
        sort($result);
        return new JsonResponse($result);
    }

    #[Route('/api/v1/sources', name: 'api_v1_sources', methods: ['GET'])]
    #[Route('/api/v2/sources', name: 'api_v2_sources', methods: ['GET'])]
    public function sources(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $vacancies = $entityManager->getRepository(Vacancy::class)->findBy(['user' => $user]);
        $sources = [];
        foreach ($vacancies as $vacancy) {
            $s = $vacancy->getSource();
            if ($s !== null && trim($s) !== '' && !in_array(strtolower(trim($s)), ['null', 'none', 'n/a'], true)) {
                $sources[trim($s)] = true;
            }
        }

        $result = array_keys($sources);
        sort($result);
        return new JsonResponse($result);
    }

    #[Route('/api/v1/columns', name: 'api_v1_columns', methods: ['GET'])]
    #[Route('/api/v2/columns', name: 'api_v2_columns', methods: ['GET'])]
    public function columns(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $cols = $this->getUserColumns($entityManager, $user);
        return new JsonResponse($cols);
    }

    #[Route('/api/v2/columns', name: 'api_v2_columns_create', methods: ['POST'])]
    public function createColumn(
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $name = trim((string)($data['name'] ?? ''));
        if ($name === '') {
            return new JsonResponse(['detail' => 'Column name cannot be empty'], Response::HTTP_BAD_REQUEST);
        }

        $cols = $this->getUserColumns($entityManager, $user);
        foreach ($cols as $c) {
            if (strcasecmp($c['id'], $name) === 0) {
                return new JsonResponse(['detail' => sprintf("Column with name '%s' already exists", $name)], Response::HTTP_BAD_REQUEST);
            }
        }

        $newCol = [
            'id' => $name,
            'color' => !empty($data['color']) ? (string)$data['color'] : '#6366f1',
            'has_lanes' => !empty($data['has_lanes']),
            'is_base' => false,
        ];

        if (count($cols) > 0 && ($cols[count($cols) - 1]['id'] ?? '') === 'Отказ') {
            array_splice($cols, count($cols) - 1, 0, [$newCol]);
        } else {
            $cols[] = $newCol;
        }

        $this->saveUserColumns($entityManager, $user, $cols);
        return new JsonResponse($cols);
    }

    #[Route('/api/v2/columns/{columnId}', name: 'api_v2_columns_update', methods: ['PATCH'])]
    public function updateColumn(
        string $columnId,
        Request $request,
        EntityManagerInterface $entityManager,
        MercurePublisherService $mercure,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $cols = $this->getUserColumns($entityManager, $user);

        $targetIdx = null;
        foreach ($cols as $idx => $c) {
            if ($c['id'] === $columnId) {
                $targetIdx = $idx;
                break;
            }
        }

        if ($targetIdx === null) {
            return new JsonResponse(['detail' => 'Column not found'], Response::HTTP_NOT_FOUND);
        }

        $vacanciesToRename = [];
        if (isset($data['new_name'])) {
            $newName = trim((string)$data['new_name']);
            if ($newName === '') {
                return new JsonResponse(['detail' => 'Column name cannot be empty'], Response::HTTP_BAD_REQUEST);
            }
            if (in_array($columnId, self::BASE_STATUSES, true) && $newName !== $columnId) {
                return new JsonResponse(['detail' => 'Base columns cannot be renamed'], Response::HTTP_BAD_REQUEST);
            }
            if ($newName !== $columnId) {
                foreach ($cols as $c) {
                    if (strcasecmp($c['id'], $newName) === 0) {
                        return new JsonResponse(['detail' => sprintf("Column with name '%s' already exists", $newName)], Response::HTTP_BAD_REQUEST);
                    }
                }

                $vacancyRepo = $entityManager->getRepository(Vacancy::class);
                $vacancies = $vacancyRepo->findBy(['user' => $user, 'status' => $columnId]);
                foreach ($vacancies as $v) {
                    $v->setStatus($newName);
                    $vacanciesToRename[] = $v;
                }

                $historyRepo = $entityManager->getRepository(VacancyStatusHistory::class);
                $historiesFrom = $historyRepo->createQueryBuilder('h')
                    ->join('h.vacancy', 'v')
                    ->where('v.user = :user AND h.fromStatus = :col')
                    ->setParameter('user', $user)
                    ->setParameter('col', $columnId)
                    ->getQuery()
                    ->getResult();
                foreach ($historiesFrom as $h) {
                    $h->setFromStatus($newName);
                }

                $historiesTo = $historyRepo->createQueryBuilder('h')
                    ->join('h.vacancy', 'v')
                    ->where('v.user = :user AND h.toStatus = :col')
                    ->setParameter('user', $user)
                    ->setParameter('col', $columnId)
                    ->getQuery()
                    ->getResult();
                foreach ($historiesTo as $h) {
                    $h->setToStatus($newName);
                }

                $cols[$targetIdx]['id'] = $newName;
            }
        }

        if (isset($data['color'])) {
            $cols[$targetIdx]['color'] = trim((string)$data['color']);
        }
        if (isset($data['has_lanes'])) {
            $cols[$targetIdx]['has_lanes'] = (bool)$data['has_lanes'];
        }

        $this->saveUserColumns($entityManager, $user, $cols);
        $entityManager->flush();

        return new JsonResponse($cols);
    }

    #[Route('/api/v2/columns/{columnId}', name: 'api_v2_columns_delete', methods: ['DELETE'])]
    public function deleteColumn(
        string $columnId,
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        if (in_array($columnId, self::BASE_STATUSES, true)) {
            return new JsonResponse(['detail' => sprintf("Base column '%s' cannot be deleted", $columnId)], Response::HTTP_BAD_REQUEST);
        }

        $cols = $this->getUserColumns($entityManager, $user);
        $exists = false;
        $remaining = [];
        foreach ($cols as $c) {
            if ($c['id'] === $columnId) {
                $exists = true;
            } else {
                $remaining[] = $c;
            }
        }

        if (!$exists) {
            return new JsonResponse(['detail' => 'Column not found'], Response::HTTP_NOT_FOUND);
        }

        $migrateTo = $request->query->get('migrate_to', 'Еще не написал');
        $vacancies = $entityManager->getRepository(Vacancy::class)->findBy(['user' => $user, 'status' => $columnId]);
        $now = new \DateTimeImmutable();
        foreach ($vacancies as $v) {
            $history = new VacancyStatusHistory($v, $v->getStatus(), $migrateTo, sprintf("Column '%s' deleted; migrated", $columnId), $now);
            $entityManager->persist($history);
            $v->setStatus($migrateTo);
            $v->setLane(0);
        }

        $this->saveUserColumns($entityManager, $user, $remaining);
        $entityManager->flush();

        return new JsonResponse($remaining);
    }

    #[Route('/api/v2/columns/order', name: 'api_v2_columns_order', methods: ['PUT'])]
    public function reorderColumns(
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $columns = $data['columns'] ?? [];
        if (!is_array($columns)) {
            return new JsonResponse(['detail' => 'Columns array is required'], Response::HTTP_BAD_REQUEST);
        }

        $colIds = array_map(static fn($c) => $c['id'] ?? '', $columns);
        foreach (self::BASE_STATUSES as $base) {
            if (!in_array($base, $colIds, true)) {
                return new JsonResponse(['detail' => sprintf("Base column '%s' cannot be missing", $base)], Response::HTTP_BAD_REQUEST);
            }
        }

        $this->saveUserColumns($entityManager, $user, $columns);
        return new JsonResponse($columns);
    }

    #[Route('/api/v2/settings', name: 'api_v2_settings_get', methods: ['GET'])]
    public function getSettings(Request $request, EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $settings = $this->loadUserSettings($request, $entityManager, $user);
        return new JsonResponse($settings);
    }

    #[Route('/api/v2/settings', name: 'api_v2_settings_post', methods: ['POST'])]
    public function updateSettings(
        Request $request,
        EntityManagerInterface $entityManager,
        #[CurrentUser] ?User $user
    ): JsonResponse {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $now = new \DateTimeImmutable();
        $repo = $entityManager->getRepository(UserSetting::class);

        if (isset($data['locale'])) {
            $loc = strtolower(trim((string)$data['locale']));
            $setting = $repo->findOneBy(['user' => $user, 'key' => 'locale']);
            if ($setting === null) {
                $setting = new UserSetting($user, 'locale', $loc, $now);
                $entityManager->persist($setting);
            } else {
                $setting->setValue($loc)->setUpdatedAt($now);
            }
        }

        if (isset($data['salary_display_format'])) {
            $fmt = strtolower(trim((string)$data['salary_display_format']));
            $setting = $repo->findOneBy(['user' => $user, 'key' => 'salary_display_format']);
            if ($setting === null) {
                $setting = new UserSetting($user, 'salary_display_format', $fmt, $now);
                $entityManager->persist($setting);
            } else {
                $setting->setValue($fmt)->setUpdatedAt($now);
            }
        }

        if (isset($data['salary_target_currency'])) {
            $cur = strtoupper(trim((string)$data['salary_target_currency']));
            $setting = $repo->findOneBy(['user' => $user, 'key' => 'salary_target_currency']);
            if ($setting === null) {
                $setting = new UserSetting($user, 'salary_target_currency', $cur, $now);
                $entityManager->persist($setting);
            } else {
                $setting->setValue($cur)->setUpdatedAt($now);
            }
        }

        if (isset($data['columns']) && is_array($data['columns'])) {
            $colIds = array_map(static fn($c) => $c['id'] ?? '', $data['columns']);
            foreach (self::BASE_STATUSES as $base) {
                if (!in_array($base, $colIds, true)) {
                    return new JsonResponse(['detail' => sprintf("Base column '%s' cannot be removed", $base)], Response::HTTP_BAD_REQUEST);
                }
            }
            $this->saveUserColumns($entityManager, $user, $data['columns']);
        }

        $entityManager->flush();
        return new JsonResponse($this->loadUserSettings($request, $entityManager, $user));
    }

    #[Route('/api/v2/stats', name: 'api_v2_stats', methods: ['GET'])]
    public function stats(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $repo = $entityManager->getRepository(Vacancy::class);
        $vacancies = $repo->findBy(['user' => $user]);

        $byStatus = [];
        $daily = [];
        foreach ($vacancies as $v) {
            $st = $v->getStatus();
            $byStatus[$st] = ($byStatus[$st] ?? 0) + 1;
            $day = $v->getCreatedAt()->format('Y-m-d');
            if (!isset($daily[$day])) {
                $daily[$day] = ['date' => $day, 'added' => 0, 'marked' => 0];
            }
            $daily[$day]['added']++;
        }

        $historyRepo = $entityManager->getRepository(VacancyStatusHistory::class);
        $histories = $historyRepo->createQueryBuilder('h')
            ->join('h.vacancy', 'v')
            ->where('v.user = :user')
            ->andWhere('h.fromStatus IS NOT NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        foreach ($histories as $h) {
            $day = $h->getCreatedAt()->format('Y-m-d');
            if (!isset($daily[$day])) {
                $daily[$day] = ['date' => $day, 'added' => 0, 'marked' => 0];
            }
            $daily[$day]['marked']++;
        }

        ksort($daily);

        return new JsonResponse([
            'today' => (new \DateTimeImmutable())->format('Y-m-d'),
            'total' => count($vacancies),
            'by_status' => $byStatus,
            'daily' => array_values($daily),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getUserColumns(EntityManagerInterface $entityManager, User $user): array
    {
        $settingRepo = $entityManager->getRepository(UserSetting::class);
        /** @var UserSetting|null $setting */
        $setting = $settingRepo->findOneBy(['user' => $user, 'key' => 'kanban_columns']);

        if ($setting !== null && $setting->getValue() !== null) {
            $cols = json_decode($setting->getValue(), true);
            if (is_array($cols) && count($cols) > 0) {
                return $cols;
            }
        }

        return self::DEFAULT_COLUMNS;
    }

    /**
     * @param array<int, array<string, mixed>> $cols
     */
    private function saveUserColumns(EntityManagerInterface $entityManager, User $user, array $cols): void
    {
        $settingRepo = $entityManager->getRepository(UserSetting::class);
        /** @var UserSetting|null $setting */
        $setting = $settingRepo->findOneBy(['user' => $user, 'key' => 'kanban_columns']);
        $now = new \DateTimeImmutable();

        $json = json_encode($cols, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        if ($setting === null) {
            $setting = new UserSetting($user, 'kanban_columns', $json, $now);
            $entityManager->persist($setting);
        } else {
            $setting->setValue($json)->setUpdatedAt($now);
        }
        $entityManager->flush();
    }

    /**
     * @return array<string, mixed>
     */
    private function loadUserSettings(Request $request, EntityManagerInterface $entityManager, User $user): array
    {
        $locale = AuthController::resolveAndPersistUserLocale($request, $entityManager, $user);
        $repo = $entityManager->getRepository(UserSetting::class);
        $settings = $repo->findBy(['user' => $user]);
        $map = [];
        foreach ($settings as $s) {
            $map[$s->getKey()] = $s->getValue();
        }

        return [
            'locale' => $locale,
            'salary_display_format' => $map['salary_display_format'] ?? 'month',
            'salary_target_currency' => $map['salary_target_currency'] ?? null,
            'columns' => $this->getUserColumns($entityManager, $user),
        ];
    }
}
