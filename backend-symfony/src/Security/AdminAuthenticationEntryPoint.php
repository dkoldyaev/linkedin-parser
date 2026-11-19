<?php

declare(strict_types=1);

namespace App\Security;

use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

class AdminAuthenticationEntryPoint implements AuthenticationEntryPointInterface
{
    public function start(Request $request, ?AuthenticationException $authException = null): Response
    {
        if (str_starts_with($request->getPathInfo(), '/admin') && $request->getPathInfo() !== '/admin/login') {
            return new RedirectResponse('/admin/login');
        }

        return new Response('{"code":401,"message":"JWT Token not found"}', Response::HTTP_UNAUTHORIZED, [
            'Content-Type' => 'application/json',
        ]);
    }
}
