<?php

namespace App\AI\Tools;

class ToolRegistry
{
    /** @var array<string, Tool> */
    private array $tools = [];

    public function register(Tool $tool): void
    {
        $this->tools[$tool->getName()] = $tool;
    }

    public function get(string $name): ?Tool
    {
        return $this->tools[$name] ?? null;
    }

    public function getAll(): array
    {
        return $this->tools;
    }

    public function getByCategory(string $category): array
    {
        return array_filter(
            $this->tools,
            fn(Tool $tool) => $tool->getCategory() === $category
        );
    }

    /**
     * Génère la définition JSON des outils pour l'API IA
     */
    public function toFunctionDefinitions(): array
    {
        return array_values(array_map(fn(Tool $tool) => [
            'type' => 'function',
            'function' => [
                'name' => $tool->getName(),
                'description' => $tool->getDescription(),
                'parameters' => $this->normalizeParameters($tool->getParameters()),
            ],
        ], $this->tools));
    }

    /**
     * Generate function definitions for a specific subset of tools.
     * @param array<string, Tool> $subset
     */
    public function toFunctionDefinitionsForTools(array $subset): array
    {
        return array_values(array_map(fn(Tool $tool) => [
            'type' => 'function',
            'function' => [
                'name' => $tool->getName(),
                'description' => $tool->getDescription(),
                'parameters' => $this->normalizeParameters($tool->getParameters()),
            ],
        ], $subset));
    }

    private function normalizeParameters(array $params): array
    {
        $params['additionalProperties'] = false;
        if (isset($params['properties']) && empty($params['properties'])) {
            $params['properties'] = new \stdClass();
        }
        if (isset($params['required']) && empty($params['required'])) {
            $params['required'] = [];
        }
        return $params;
    }
}
