<?php

namespace App\AI\Planner;

class ExecutionPlan
{
    public function __construct(
        public readonly string $id,
        public readonly string $summary,
        /** @var PlanStep[] */
        public readonly array $steps,
        public readonly bool $requiresConfirmation = false,
        public readonly ?string $confirmationMessage = null,
    ) {}

    /**
     * Crée un plan à partir des tool_calls de Gemini.
     *
     * @param array<int, array{id: string, name: string, arguments: array}> $toolCalls
     * @param array<string, Tool> $tools  ToolRegistry pour vérifier requiresConfirmation
     */
    public static function fromToolCalls(string $summary, array $toolCalls, array $tools): self
    {
        $steps = [];
        $needsConfirmation = false;

        foreach ($toolCalls as $index => $tc) {
            $tool = $tools[$tc['name']] ?? null;
            $requiresConf = $tool?->requiresConfirmation() ?? false;
            if ($requiresConf) {
                $needsConfirmation = true;
            }

            $description = $tool?->getDescription() ?? $tc['name'];

            $steps[] = new PlanStep(
                index: $index,
                toolName: $tc['name'],
                parameters: $tc['arguments'],
                description: "Exécuter {$tc['name']}",
                requiresConfirmation: $requiresConf,
                dependsOn: $index > 0 ? $index - 1 : null,
            );
        }

        $confirmMsg = $needsConfirmation
            ? "Certaines étapes nécessitent votre confirmation avant d'être exécutées."
            : null;

        return new self(
            id: 'plan_' . uniqid('', true),
            summary: $summary,
            steps: $steps,
            requiresConfirmation: $needsConfirmation,
            confirmationMessage: $confirmMsg,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'summary' => $this->summary,
            'steps' => array_map(fn(PlanStep $s) => $s->toArray(), $this->steps),
            'requires_confirmation' => $this->requiresConfirmation,
            'confirmation_message' => $this->confirmationMessage,
        ];
    }

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            summary: $data['summary'],
            steps: array_map(fn($s) => PlanStep::fromArray($s), $data['steps']),
            requiresConfirmation: $data['requires_confirmation'] ?? false,
            confirmationMessage: $data['confirmation_message'] ?? null,
        );
    }

    /**
     * Nombre total d'étapes.
     */
    public function stepCount(): int
    {
        return count($this->steps);
    }

    /**
     * Étapes avec confirmation requise.
     */
    public function confirmationSteps(): array
    {
        return array_filter($this->steps, fn(PlanStep $s) => $s->requiresConfirmation);
    }
}
