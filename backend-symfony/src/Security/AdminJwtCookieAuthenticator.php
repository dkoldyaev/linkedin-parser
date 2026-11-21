<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Encoder\JWTEncoderInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

class AdminJwtCookieAuthenticator extends AbstractAuthenticator implements AuthenticationEntryPointInterface
{
    private JWTEncoderInterface $jwtEncoder;
    private UserRepository $userRepository;

    public function __construct(JWTEncoderInterface $jwtEncoder, UserRepository $userRepository)
    {
        $this->jwtEncoder = $jwtEncoder;
        $this->userRepository = $userRepository;
    }

    public function supports(Request $request): ?bool
    {
        $path = rtrim($request->getPathInfo(), '/') ?: '/';
        if ($path === '/admin/login' || !str_starts_with($path, '/admin')) {
            return false;
        }

        return true;
    }

    public function authenticate(Request $request): Passport
    {
        $token = (string)$request->cookies->get('access_token');
        if ($token === '') {
            $authHeader = (string)$request->headers->get('Authorization');
            if (str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
            }
        }

        if ($token === '') {
            throw new AuthenticationException('No access token found');
        }

        try {
            $payload = $this->jwtEncoder->decode($token);
        } catch (\Throwable $e) {
            throw new AuthenticationException('Invalid or expired JWT token', 0, $e);
        }

        $email = $payload['sub'] ?? ($payload['username'] ?? null);
        if ($email === null || !is_string($email) || $email === '') {
            throw new AuthenticationException('No subject in JWT token');
        }

        return new SelfValidatingPassport(new UserBadge($email, function (string $userIdentifier): User {
            $user = $this->userRepository->findByEmail($userIdentifier);
            if ($user === null) {
                throw new UserNotFoundException(sprintf('User "%s" not found.', $userIdentifier));
            }
            return $user;
        }));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new RedirectResponse('/admin/login');
    }

    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        return new RedirectResponse('/admin/login');
    }
}
