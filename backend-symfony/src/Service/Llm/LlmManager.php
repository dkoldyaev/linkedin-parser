<?php

declare(strict_types=1);

namespace App\Service\Llm;

use InvalidArgumentException;

class LlmManager
{
    private string $defaultProviderName;
    private MockLlmProvider $mockProvider;

    public function __construct(string $defaultProviderName, MockLlmProvider $mockProvider)
    {
        $this->defaultProviderName = $defaultProviderName;
        $this->mockProvider = $mockProvider;
    }

    public function getProvider(string $providerName): LlmProviderInterface
    {
        $normalized = strtolower(trim($providerName));
        if ($normalized === 'mock') {
            return $this->mockProvider;
        }

        throw new InvalidArgumentException(sprintf('Unsupported LLM provider: "%s"', $providerName));
    }

    public function getDefaultProvider(): LlmProviderInterface
    {
        return $this->getProvider($this->defaultProviderName);
    }
}
