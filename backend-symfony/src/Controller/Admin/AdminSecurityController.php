<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\User;
use App\Entity\UserFeatureFlag;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

class AdminSecurityController extends AbstractController
{
    #[Route('/admin/login', name: 'admin_login', methods: ['GET', 'POST'])]
    public function login(
        Request $request,
        UserRepository $userRepository,
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager,
        #[CurrentUser] ?User $currentUser
    ): Response {
        $adminEmail = isset($_SERVER['ADMIN_EMAIL']) && (string)$_SERVER['ADMIN_EMAIL'] !== ''
            ? (string)$_SERVER['ADMIN_EMAIL']
            : 'dkoldyaev@gmail.com';

        if ($request->isMethod('POST')) {
            $user = $userRepository->findByEmail($adminEmail);
            $now = new \DateTimeImmutable();

            if ($user === null) {
                $user = new User(
                    $adminEmail,
                    'Administrator',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=' . substr(md5($adminEmail), 0, 8),
                    true,
                    ['ROLE_USER', 'ROLE_ADMIN'],
                    $now
                );
                $entityManager->persist($user);
            } else {
                $roles = $user->getRoles();
                if (!in_array('ROLE_ADMIN', $roles, true)) {
                    $roles[] = 'ROLE_ADMIN';
                    $user->setRoles($roles);
                }
            }

            // Ensure admin flag exists
            $hasAdminFlag = false;
            foreach ($user->getFeatureFlags() as $f) {
                if ($f->getFlag() === 'admin') {
                    $hasAdminFlag = true;
                    break;
                }
            }
            if (!$hasAdminFlag) {
                $flag = new UserFeatureFlag($user, 'admin', $now);
                $entityManager->persist($flag);
            }

            $entityManager->flush();

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

        if ($currentUser !== null && $currentUser->isAdmin()) {
            return $this->redirect('/admin');
        }

        $currentStatus = $currentUser !== null
            ? sprintf('Вы авторизованы как %s (%s), но у этого аккаунта нет роли ROLE_ADMIN.', htmlspecialchars($currentUser->getName() ?? $currentUser->getEmail(), ENT_QUOTES, 'UTF-8'), htmlspecialchars($currentUser->getEmail(), ENT_QUOTES, 'UTF-8'))
            : 'Вы в данный момент не авторизованы.';

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
            max-width: 480px;
            width: 100%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            text-align: center;
        }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #ffffff; }
        p.subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
        .status-box {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 13px;
            color: #cbd5e1;
            margin-bottom: 24px;
            text-align: left;
            line-height: 1.4;
        }
        button.btn-primary {
            display: inline-block;
            width: 100%;
            background: #3b82f6;
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }
        button.btn-primary:hover { background: #2563eb; }
        .footer-link {
            display: inline-block;
            margin-top: 20px;
            font-size: 13px;
            color: #94a3b8;
            text-decoration: none;
        }
        .footer-link:hover { color: #f8fafc; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🛡️</div>
        <h1>Панель управления</h1>
        <p class="subtitle">Для доступа к EasyAdmin требуются права администратора (<code>ROLE_ADMIN</code>).</p>
        
        <div class="status-box">
            {$currentStatus}
        </div>

        <form method="POST" action="/admin/login">
            <button type="submit" class="btn-primary">
                Войти как {$adminEmail}
            </button>
        </form>

        <a href="/" class="footer-link">← Вернуться к списку вакансий</a>
    </div>
</body>
</html>
HTML;

        return new Response($html, Response::HTTP_OK, ['Content-Type' => 'text/html; charset=utf-8']);
    }
}
