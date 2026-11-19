<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

class RefreshTokenService
{
    public const ACCESS_TOKEN_TTL = 3600; // 1 hour
    public const REFRESH_TOKEN_TTL = 2592000; // 30 days

    private EntityManagerInterface $entityManager;
    private RefreshTokenRepository $refreshTokenRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        RefreshTokenRepository $refreshTokenRepository
    ) {
        $this->entityManager = $entityManager;
        $this->refreshTokenRepository = $refreshTokenRepository;
    }

    public function createRefreshToken(User $user, \DateTimeImmutable $now): RefreshToken
    {
        $tokenString = bin2hex(random_bytes(32));
        $expiresAt = $now->modify('+' . self::REFRESH_TOKEN_TTL . ' seconds');

        $refreshToken = new RefreshToken($user, $tokenString, $expiresAt, $now);
        $this->entityManager->persist($refreshToken);
        $this->entityManager->flush();

        return $refreshToken;
    }

    public function rotateRefreshToken(RefreshToken $existingToken, \DateTimeImmutable $now): RefreshToken
    {
        $existingToken->revoke($now);

        $newTokenString = bin2hex(random_bytes(32));
        $expiresAt = $now->modify('+' . self::REFRESH_TOKEN_TTL . ' seconds');

        $newToken = new RefreshToken($existingToken->getUser(), $newTokenString, $expiresAt, $now);
        $this->entityManager->persist($newToken);
        $this->entityManager->flush();

        return $newToken;
    }

    public function findValidRefreshToken(string $rawToken, \DateTimeImmutable $now): ?RefreshToken
    {
        return $this->refreshTokenRepository->findValidToken(trim($rawToken), $now);
    }

    public function revokeToken(string $rawToken, \DateTimeImmutable $now): void
    {
        $token = $this->refreshTokenRepository->findOneBy(['token' => trim($rawToken)]);
        if ($token !== null && $token->getRevokedAt() === null) {
            $token->revoke($now);
            $this->entityManager->flush();
        }
    }

    public function createAccessTokenCookie(Request $request, string $jwtToken): Cookie
    {
        $forwardedProto = $request->headers->get('x-forwarded-proto');
        $isSecure = $request->isSecure() || $forwardedProto === 'https' || str_starts_with($request->getUri(), 'https://');

        return Cookie::create('access_token')
            ->withValue($jwtToken)
            ->withExpires(time() + self::ACCESS_TOKEN_TTL)
            ->withPath('/')
            ->withHttpOnly(true)
            ->withSameSite('lax')
            ->withSecure($isSecure);
    }

    public function createRefreshTokenCookie(Request $request, string $tokenString): Cookie
    {
        $forwardedProto = $request->headers->get('x-forwarded-proto');
        $isSecure = $request->isSecure() || $forwardedProto === 'https' || str_starts_with($request->getUri(), 'https://');

        return Cookie::create('refresh_token')
            ->withValue($tokenString)
            ->withExpires(time() + self::REFRESH_TOKEN_TTL)
            ->withPath('/')
            ->withHttpOnly(true)
            ->withSameSite('lax')
            ->withSecure($isSecure);
    }

    public function createClearRefreshCookie(): Cookie
    {
        return Cookie::create('refresh_token')
            ->withValue('')
            ->withExpires(1)
            ->withPath('/')
            ->withHttpOnly(true)
            ->withSameSite('lax');
    }
}
