<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\RefreshToken;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RefreshToken>
 */
class RefreshTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RefreshToken::class);
    }

    public function findValidToken(string $token, \DateTimeImmutable $now): ?RefreshToken
    {
        return $this->createQueryBuilder('r')
            ->andWhere('r.token = :token')
            ->andWhere('r.revokedAt IS NULL')
            ->andWhere('r.expiresAt > :now')
            ->setParameter('token', $token)
            ->setParameter('now', $now)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function revokeAllForUser(User $user, \DateTimeImmutable $now): void
    {
        $this->createQueryBuilder('r')
            ->update()
            ->set('r.revokedAt', ':now')
            ->andWhere('r.user = :user')
            ->andWhere('r.revokedAt IS NULL')
            ->setParameter('user', $user)
            ->setParameter('now', $now)
            ->getQuery()
            ->execute();
    }
}
