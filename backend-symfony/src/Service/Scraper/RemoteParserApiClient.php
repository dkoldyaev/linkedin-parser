<?php

declare(strict_types=1);

namespace App\Service\Scraper;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class RemoteParserApiClient
{
    private HttpClientInterface $httpClient;
    private string $parserApiUrl;

    public function __construct(HttpClientInterface $httpClient, string $parserApiUrl)
    {
        $this->httpClient = $httpClient;
        $this->parserApiUrl = rtrim($parserApiUrl, '/');
    }

    /**
     * @return array<string, mixed>
     */
    public function parseJob(string $url): array
    {
        $response = $this->httpClient->request('POST', sprintf('%s/api/parse', $this->parserApiUrl), [
            'json' => ['url' => $url],
            'timeout' => 45.0,
        ]);

        return $response->toArray();
    }
}
