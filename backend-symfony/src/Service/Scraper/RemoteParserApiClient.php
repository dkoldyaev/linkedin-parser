<?php

declare(strict_types=1);

namespace App\Service\Scraper;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class RemoteParserApiClient
{
    private HttpClientInterface $httpClient;
    private string $parserApiUrl;
    private LoggerInterface $logger;

    public function __construct(HttpClientInterface $httpClient, string $parserApiUrl, LoggerInterface $logger)
    {
        $this->httpClient = $httpClient;
        $this->parserApiUrl = rtrim($parserApiUrl, '/');
        $this->logger = $logger;
    }

    /**
     * @return array<string, mixed>
     */
    public function parseJob(string $url, ?string $html): array
    {
        $jobHtml = $html;

        // If HTML is not supplied (e.g. background queue / batch URL), attempt fetching it directly first
        if ($jobHtml === null || trim($jobHtml) === '') {
            try {
                $fetchResponse = $this->httpClient->request('GET', $url, [
                    'headers' => [
                        'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language' => 'en-US,en;q=0.9,ru;q=0.8',
                    ],
                    'timeout' => 15.0,
                    'max_redirects' => 5,
                ]);
                if ($fetchResponse->getStatusCode() === 200) {
                    $jobHtml = $fetchResponse->getContent(false);
                }
            } catch (\Throwable $e) {
                $this->logger->warning(sprintf('RemoteParserApiClient: failed to fetch HTML for %s: %s', $url, $e->getMessage()));
            }
        }

        $payload = ['url' => $url];
        if ($jobHtml !== null && $jobHtml !== '') {
            $payload['html'] = $jobHtml;
        }

        try {
            $response = $this->httpClient->request('POST', sprintf('%s/api/parse', $this->parserApiUrl), [
                'json' => $payload,
                'timeout' => 45.0,
            ]);

            $statusCode = $response->getStatusCode();
            if ($statusCode === 200) {
                $data = $response->toArray(false);
                if (is_array($data) && !empty($data['source'])) {
                    if (empty($data['url'])) {
                        $data['url'] = $url;
                    }
                    return $data;
                }
            }
        } catch (\Throwable $e) {
            $this->logger->warning(sprintf('RemoteParserApiClient: error from parser-api: %s', $e->getMessage()));
        }

        // Safe fallback if parser-api returns non-200 or is unavailable
        $parsedUrl = parse_url($url);
        $domain = isset($parsedUrl['host']) ? str_replace('www.', '', (string)$parsedUrl['host']) : 'Unknown';

        return [
            'url' => $url,
            'source' => str_contains($url, 'linkedin.com') ? 'LinkedIn' : (str_contains($url, 'upwork.com') ? 'Upwork' : $domain),
            'title' => null,
            'company' => str_contains($url, 'upwork.com') ? 'Upwork' : null,
            'description' => null,
            'location' => null,
        ];
    }
}
