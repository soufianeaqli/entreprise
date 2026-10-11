<?php

namespace App\AI\Executor;

use App\AI\Planner\ExecutionPlan;
use App\AI\Planner\PlanStep;
use App\AI\Tools\ToolRegistry;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class Executor
{
    public function __construct(
        private ToolRegistry $toolRegistry,
    ) {}

    /**
     * Exécute un plan étape par étape.
     *
     * @return ExecutionResult
     */
    public function execute(ExecutionPlan $plan, User $user): ExecutionResult
    {
        $start = microtime(true);
        $stepResults = [];
        $stopOnFailure = false;

        Log::info('AI Plan execution started', [
            'plan_id' => $plan->id,
            'steps_count' => $plan->stepCount(),
            'user_id' => $user->id,
        ]);

        foreach ($plan->steps as $step) {
            // Skip if a previous critical step failed
            if ($stopOnFailure) {
                $step->status = 'skipped';
                $stepResults[] = [
                    'step' => $step->index,
                    'tool' => $step->toolName,
                    'status' => 'skipped',
                ];
                continue;
            }

            // Check dependency
            if ($step->dependsOn !== null) {
                $depResult = $stepResults[$step->dependsOn] ?? null;
                if ($depResult && $depResult['status'] === 'failed') {
                    $step->status = 'skipped';
                    $stepResults[] = [
                        'step' => $step->index,
                        'tool' => $step->toolName,
                        'status' => 'skipped',
                        'error' => 'Dépendance échouée',
                    ];
                    $stopOnFailure = true;
                    continue;
                }
            }

            $step->status = 'running';

            $tool = $this->toolRegistry->get($step->toolName);
            if (!$tool) {
                $step->status = 'failed';
                $step->error = "Tool '{$step->toolName}' non trouvé";
                $stepResults[] = [
                    'step' => $step->index,
                    'tool' => $step->toolName,
                    'status' => 'failed',
                    'error' => $step->error,
                ];
                $stopOnFailure = true;
                continue;
            }

            try {
                $result = $tool->execute($step->parameters, $user->id, $user->role);
                $step->status = 'completed';
                $step->result = is_array($result) ? $result : ['result' => $result];

                $stepResults[] = [
                    'step' => $step->index,
                    'tool' => $step->toolName,
                    'status' => 'completed',
                    'result' => $step->result,
                ];

                Log::info('AI Plan step completed', [
                    'plan_id' => $plan->id,
                    'step' => $step->index,
                    'tool' => $step->toolName,
                ]);
            } catch (\Throwable $e) {
                $step->status = 'failed';
                $step->error = $e->getMessage();

                $stepResults[] = [
                    'step' => $step->index,
                    'tool' => $step->toolName,
                    'status' => 'failed',
                    'error' => $e->getMessage(),
                ];

                Log::error('AI Plan step failed', [
                    'plan_id' => $plan->id,
                    'step' => $step->index,
                    'tool' => $step->toolName,
                    'error' => $e->getMessage(),
                ]);

                // Continue to next step (don't stop on failure for non-critical)
                // Only stop if it's a data-fetching tool (read operations)
                // For now, continue execution
            }
        }

        $duration = (microtime(true) - $start) * 1000;
        $allCompleted = collect($stepResults)->every(fn($r) => $r['status'] === 'completed' || $r['status'] === 'skipped');
        $anyCompleted = collect($stepResults)->contains(fn($r) => $r['status'] === 'completed');

        if ($allCompleted || $anyCompleted) {
            return ExecutionResult::success($plan->id, $stepResults, $duration);
        }

        $firstError = collect($stepResults)->firstWhere('status', 'failed')['error'] ?? 'Erreur inconnue';
        return ExecutionResult::partial($plan->id, $stepResults, $firstError, $duration);
    }
}
