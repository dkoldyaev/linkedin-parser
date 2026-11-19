<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Entity\UserSetting;
use App\Entity\Vacancy;
use App\Entity\VacancyStatusHistory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class MetadataController extends AbstractController
{
    private const DEFAULT_COLUMNS = [
        ['id' => 'Еще не написал', 'color' => '#6366f1', 'has_lanes' => false, 'is_base' => true],
        ['id' => 'Написал', 'color' => '#0284c7', 'has_lanes' => false, 'is_base' => false],
        ['id' => 'Собеседование', 'color' => '#d97706', 'has_lanes' => true, 'is_base' => false],
        ['id' => 'Тестовое', 'color' => '#9333ea', 'has_lanes' => true, 'is_base' => false],
        ['id' => 'Оффер', 'color' => '#059669', 'has_lanes' => false, 'is_base' => false],
        ['id' => 'Отказ', 'color' => '#ef4444', 'has_lanes' => false, 'is_base' => true],
    ];

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

    #[Route('/api/v2/columns', name: 'api_v2_columns', methods: ['GET'])]
    public function columns(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        $settingRepo = $entityManager->getRepository(UserSetting::class);
        /** @var UserSetting|null $setting */
        $setting = $settingRepo->findOneBy(['user' => $user, 'key' => 'kanban_columns']);

        if ($setting !== null && $setting->getValue() !== null) {
            $cols = json_decode($setting->getValue(), true);
            if (is_array($cols)) {
                return new JsonResponse($cols);
            }
        }

        return new JsonResponse(self::DEFAULT_COLUMNS);
    }

    #[Route('/api/v2/settings', name: 'api_v2_settings_get', methods: ['GET'])]
    public function getSettings(EntityManagerInterface $entityManager, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return new JsonResponse(['detail' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'locale' => 'ru',
            'salary_display_format' => 'month',
            'salary_target_currency' => null,
            'columns' => self::DEFAULT_COLUMNS,
        ]);
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
}
