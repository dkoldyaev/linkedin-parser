<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class AdminSecurityController extends AbstractController
{
    #[Route('/admin/login', name: 'admin_login', methods: ['GET', 'POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        JWTTokenManagerInterface $jwtManager,
        #[CurrentUser] ?User $currentUser
    ): Response {
        if ($currentUser !== null && $currentUser->isAdmin()) {
            return $this->redirect('/admin');
        }

        $errorMessage = null;

        if ($request->isMethod('POST')) {
            $email = strtolower(trim((string)$request->request->get('email')));
            $password = (string)$request->request->get('password');

            if ($email === '' || $password === '') {
                $errorMessage = 'Пожалуйста, введите email и пароль.';
            } else {
                $user = $userRepository->findByEmail($email);

                if ($user === null || $user->getPassword() === null || !$passwordHasher->isPasswordValid($user, $password)) {
                    $errorMessage = 'Неверный email или пароль.';
                } elseif (!$user->isAdmin() && !in_array('ROLE_ADMIN', $user->getRoles(), true)) {
                    $errorMessage = 'Доступ запрещен: у вашей учетной записи нет прав администратора (ROLE_ADMIN).';
                } else {
                    $token = $jwtManager->create($user);
                    $response = $this->redirect('/admin');
                    $cookie = Cookie::create('access_token')
                        ->withValue($token)
                        ->withExpires(time() + 86400 * 30)
                        ->withPath('/')
                        ->withHttpOnly(true)
                        ->withSameSite('lax')
                        ->withSecure($request->isSecure());
                    $response->headers->setCookie($cookie);

                    return $response;
                }
            }
        }

        $errorHtml = '';
        if ($errorMessage !== null) {
            $safeError = htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8');
            $errorHtml = <<<HTML
            <div class="alert-error">
                {$safeError}
            </div>
HTML;
        }

        $defaultEmail = htmlspecialchars((string)$request->request->get('email', 'dkoldyaev@gmail.com'), ENT_QUOTES, 'UTF-8');

        $html = <<<HTML
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход в панель администратора — LinkedIn Tracker</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 32px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        .icon { font-size: 40px; margin-bottom: 12px; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
        p.subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
        .alert-error {
            background: #450a0a;
            border: 1px solid #991b1b;
            color: #fca5a5;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 20px;
            text-align: left;
            line-height: 1.4;
        }
        .form-group {
            margin-bottom: 16px;
            text-align: left;
        }
        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #cbd5e1;
            margin-bottom: 6px;
        }
        input[type="email"], input[type="password"] {
            width: 100%;
            padding: 10px 14px;
            background: #0f172a;
            border: 1px solid #475569;
            border-radius: 6px;
            color: #ffffff;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        input[type="email"]:focus, input[type="password"]:focus {
            border-color: #3b82f6;
        }
        button.btn-primary {
            display: inline-block;
            width: 100%;
            background: #2563eb;
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
            margin-top: 8px;
        }
        button.btn-primary:hover { background: #1d4ed8; }
        .footer-link {
            display: inline-block;
            margin-top: 24px;
            font-size: 13px;
            color: #94a3b8;
            text-decoration: none;
        }
        .footer-link:hover { color: #f8fafc; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🔐</div>
        <h1>Вход в панель администратора</h1>
        <p class="subtitle">LinkedIn Vacancy Tracker — EasyAdmin</p>
        
        {$errorHtml}

        <form method="POST" action="/admin/login">
            <div class="form-group">
                <label for="email">Email администратора</label>
                <input type="email" id="email" name="email" value="{$defaultEmail}" required autofocus autocomplete="username">
            </div>

            <div class="form-group">
                <label for="password">Пароль</label>
                <input type="password" id="password" name="password" required autocomplete="current-password">
            </div>

            <button type="submit" class="btn-primary">
                Войти
            </button>
        </form>

        <a href="/" class="footer-link">← Вернуться к списку вакансий</a>
    </div>
</body>
</html>
HTML;

        return new Response($html, Response::HTTP_OK, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    #[Route('/admin/logout', name: 'admin_logout', methods: ['GET', 'POST'])]
    public function logout(): Response
    {
        $response = $this->redirect('/admin/login');
        $response->headers->clearCookie('access_token', '/');

        return $response;
    }
}
