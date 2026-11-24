<?php

declare(strict_types=1);

namespace App\Doctrine\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Vacancy;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\RequestStack;

class VacancyFilterExtension implements QueryCollectionExtensionInterface
{
    private RequestStack $requestStack;

    public function __construct(RequestStack $requestStack)
    {
        $this->requestStack = $requestStack;
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = []
    ): void {
        if ($resourceClass !== Vacancy::class) {
            return;
        }

        $request = $this->requestStack->getCurrentRequest();
        if (!$request) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0] ?? 'o';

        $country = $request->query->get('country');
        if ($country !== null && trim((string)$country) !== '') {
            $param = $queryNameGenerator->generateParameterName('country');
            $queryBuilder->andWhere(sprintf('LOWER(%s.country) = LOWER(:%s)', $rootAlias, $param))
                ->setParameter($param, trim((string)$country));
        }

        $city = $request->query->get('city');
        if ($city !== null && trim((string)$city) !== '') {
            $param = $queryNameGenerator->generateParameterName('city');
            $queryBuilder->andWhere(sprintf('LOWER(%s.city) = LOWER(:%s)', $rootAlias, $param))
                ->setParameter($param, trim((string)$city));
        }

        $workplaceType = $request->query->get('workplace_type');
        if ($workplaceType !== null && trim((string)$workplaceType) !== '') {
            $param = $queryNameGenerator->generateParameterName('workplace_type');
            $queryBuilder->andWhere(sprintf('LOWER(%s.workplaceType) = LOWER(:%s)', $rootAlias, $param))
                ->setParameter($param, trim((string)$workplaceType));
        }

        $source = $request->query->get('source');
        if ($source !== null && trim((string)$source) !== '') {
            $param = $queryNameGenerator->generateParameterName('source');
            $queryBuilder->andWhere(sprintf('LOWER(%s.source) = LOWER(:%s)', $rootAlias, $param))
                ->setParameter($param, trim((string)$source));
        }

        $isClosed = $request->query->get('is_closed');
        if ($isClosed !== null && trim((string)$isClosed) !== '') {
            $param = $queryNameGenerator->generateParameterName('is_closed');
            $boolVal = in_array(strtolower(trim((string)$isClosed)), ['1', 'true', 'yes'], true);
            $queryBuilder->andWhere(sprintf('%s.isClosed = :%s', $rootAlias, $param))
                ->setParameter($param, $boolVal);
        }

        $search = $request->query->get('search');
        if ($search !== null && trim((string)$search) !== '') {
            $param = $queryNameGenerator->generateParameterName('search');
            $queryBuilder->andWhere(sprintf(
                'LOWER(%s.title) LIKE :%s OR LOWER(%s.company) LIKE :%s OR LOWER(%s.location) LIKE :%s OR LOWER(%s.city) LIKE :%s OR LOWER(%s.country) LIKE :%s OR LOWER(%s.description) LIKE :%s OR LOWER(%s.aiSummary) LIKE :%s OR LOWER(%s.source) LIKE :%s',
                $rootAlias, $param, $rootAlias, $param, $rootAlias, $param, $rootAlias, $param, $rootAlias, $param, $rootAlias, $param, $rootAlias, $param, $rootAlias, $param
            ))->setParameter($param, '%' . strtolower(trim((string)$search)) . '%');
        }
    }
}
