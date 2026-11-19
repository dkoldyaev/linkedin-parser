<?php

declare(strict_types=1);

namespace App\Tests\Support;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\BrowserKit\Cookie;
use Symfony\Component\HttpFoundation\Response;

abstract class ApiTestCase extends WebTestCase
{
    protected KernelBrowser $client;
    protected EntityManagerInterface $entityManager;
    protected TestMercureHub $mercureHub;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();
        $container = $this->client->getContainer();

        /** @var EntityManagerInterface $em */
        $em = $container->get(EntityManagerInterface::class);
        $this->entityManager = $em;

        /** @var TestMercureHub $hub */
        $hub = $container->get(TestMercureHub::class);
        $this->mercureHub = $hub;
        $this->mercureHub->clear();

        DatabasePrimer::setUpDatabase($this->entityManager);
    }

    protected function loginAndGetToken(KernelBrowser $client, string $email, string $name): string
    {
        $client->request(
            'POST',
            '/api/v2/auth/dev-login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) json_encode(['email' => $email, 'name' => $name], JSON_UNESCAPED_UNICODE)
        );

        $response = $client->getResponse();
        $this->assertSame(200, $response->getStatusCode(), 'dev-login failed: ' . $response->getContent());

        $data = json_decode((string) $response->getContent(), true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('token', $data);

        return (string) $data['token'];
    }

    protected function authenticateClientAs(KernelBrowser $client, string $email, string $name): void
    {
        $token = $this->loginAndGetToken($client, $email, $name);
        $client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer ' . $token);
        $client->getCookieJar()->set(new Cookie('access_token', $token, null, '/', 'localhost'));
    }

    protected function authenticateClientWithApiKey(KernelBrowser $client, string $apiKey): void
    {
        $client->setServerParameter('HTTP_X_API_KEY', $apiKey);
    }

    /**
     * @return array<string, mixed>|list<mixed>
     */
    protected function parseJsonResponse(Response $response): array
    {
        $content = (string) $response->getContent();
        $decoded = json_decode($content, true);
        $this->assertIsArray($decoded, 'Expected JSON array or object, got: ' . $content);

        return $decoded;
    }

    /**
     * @return array<string, mixed>
     */
    protected function assertMercureEvent(string $eventType): array
    {
        $event = $this->mercureHub->getLastEvent($eventType);
        $this->assertNotNull($event, sprintf('Mercure event "%s" was not published.', $eventType));

        return $event;
    }
}
