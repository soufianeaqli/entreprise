<?php

namespace App\AI\Actions;

class ActionRegistry
{
    /** @var array<string, Action> */
    private array $actions = [];

    public function register(Action $action): void
    {
        $this->actions[$action->getName()] = $action;
    }

    public function get(string $name): ?Action
    {
        return $this->actions[$name] ?? null;
    }

    public function getAll(): array
    {
        return $this->actions;
    }

    /**
     * Génère la définition JSON des actions pour l'IA
     */
    public function toFunctionDefinitions(): array
    {
        return array_map(fn(Action $action) => [
            'type' => 'function',
            'function' => [
                'name' => $action->getName(),
                'description' => $action->getDescription(),
                'parameters' => $action->getParameters(),
            ],
        ], $this->actions);
    }
}
