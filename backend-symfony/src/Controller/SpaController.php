<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class SpaController extends AbstractController
{
    #[Route('/{path}', name: 'app_spa_fallback', requirements: ['path' => '^(?!api|admin|_profiler|_wdt|assets|build|bundles).*'], priority: -1000)]
    public function index(string $path): Response
    {
        if (preg_match('/\.(css|js|map|json|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico)$/i', $path)) {
            return new Response('Asset not found', Response::HTTP_NOT_FOUND);
        }

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
