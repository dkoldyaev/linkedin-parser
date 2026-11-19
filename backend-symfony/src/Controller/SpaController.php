<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class SpaController extends AbstractController
{
    #[Route('/{path}', name: 'app_spa_fallback', requirements: ['path' => '^(?!api|admin|_profiler|_wdt|assets|build).*'], priority: -1000)]
    public function index(string $path): Response
    {
        $indexPath = $this->getParameter('kernel.project_dir') . '/public/index.html';
        if (file_exists($indexPath)) {
            return new Response((string)file_get_contents($indexPath), Response::HTTP_OK, [
                'Content-Type' => 'text/html',
            ]);
        }

        return new Response('Frontend not built', Response::HTTP_NOT_FOUND);
    }

    #[Route('/', name: 'app_spa_root', priority: -1000)]
    public function root(): Response
    {
        $indexPath = $this->getParameter('kernel.project_dir') . '/public/index.html';
        if (file_exists($indexPath)) {
            return new Response((string)file_get_contents($indexPath), Response::HTTP_OK, [
                'Content-Type' => 'text/html',
            ]);
        }

        return new Response('Frontend not built', Response::HTTP_NOT_FOUND);
    }
}
