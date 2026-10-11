<?php

namespace App\AI\Executor;

class ExecutionResult
{
    /**
     * @param array<int, array{step: int, tool: string, status: string, result?: array, error?: string}> $stepResults
     */
    private function __construct(
        public readonly string $planId,
        public readonly bool $success,
        public readonly array $stepResults,
        public readonly ?string $error = null,
        public readonly float $durationMs = 0,
    ) {}

    public static function success(string $planId, array $stepResults, float $durationMs): self
    {
        return new self($planId, true, $stepResults, durationMs: $durationMs);
    }

    public static function partial(string $planId, array $stepResults, string $error, float $durationMs): self
    {
        return new self($planId, false, $stepResults, $error, $durationMs);
    }

    public static function failure(string $planId, string $error, float $durationMs): self
    {
        return new self($planId, false, [], $error, $durationMs);
    }

    public function toArray(): array
    {
        return [
            'plan_id' => $this->planId,
            'success' => $this->success,
            'step_results' => $this->stepResults,
            'error' => $this->error,
            'duration_ms' => round($this->durationMs, 2),
        ];
    }
}
