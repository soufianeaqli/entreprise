<?php

namespace App\AI\Planner;

class PlanStep
{
    public function __construct(
        public readonly int $index,
        public readonly string $toolName,
        public readonly array $parameters,
        public readonly string $description,
        public readonly bool $requiresConfirmation = false,
        public readonly ?int $dependsOn = null,
        public ?string $status = 'pending',
        public ?array $result = null,
        public ?string $error = null,
    ) {}

    public function toArray(): array
    {
        return [
            'index' => $this->index,
            'tool' => $this->toolName,
            'parameters' => $this->parameters,
            'description' => $this->description,
            'requires_confirmation' => $this->requiresConfirmation,
            'depends_on' => $this->dependsOn,
            'status' => $this->status,
            'result' => $this->result,
            'error' => $this->error,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            index: $data['index'],
            toolName: $data['tool'],
            parameters: $data['parameters'] ?? [],
            description: $data['description'] ?? '',
            requiresConfirmation: $data['requires_confirmation'] ?? false,
            dependsOn: $data['depends_on'] ?? null,
            status: $data['status'] ?? 'pending',
            result: $data['result'] ?? null,
            error: $data['error'] ?? null,
        );
    }
}
