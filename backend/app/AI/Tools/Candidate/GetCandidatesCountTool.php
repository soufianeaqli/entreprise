<?php

namespace App\AI\Tools\Candidate;

use App\AI\Tools\Tool;
use App\Models\Candidate;
use Illuminate\Support\Facades\Log;

class GetCandidatesCountTool implements Tool
{
    public function getName(): string
    {
        return 'get_candidates_count';
    }

    public function getDescription(): string
    {
        return 'Nombre total de candidats et décompte par statut.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [],
            'required' => [],
        ];
    }

    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);

        try {
            $query = Candidate::query();

            // RH scoping
            if ($role === 'rh') {
                $departmentId = $this->getRhDepartmentId($userId);
                if ($departmentId) {
                    $query->where('department_id', $departmentId);
                }
            }

            $total = (clone $query)->count();
            $byStatus = [];
            foreach (Candidate::STATUSES as $key => $label) {
                $byStatus[$key] = (clone $query)->where('status', $key)->count();
            }

            $duration = round((microtime(true) - $start) * 1000, 2);

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'total' => $total,
            ]);

            return [
                'total' => $total,
                'by_status' => $byStatus,
            ];
        } catch (\Throwable $e) {
            Log::error('AI Tool failed', ['tool' => $this->getName(), 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function getRhDepartmentId(int $userId): ?int
    {
        $user = \App\Models\User::find($userId);
        return $user?->rhManager?->department?->id;
    }

    public function requiresConfirmation(): bool
    {
        return false;
    }

    public function getCategory(): string
    {
        return 'candidates';
    }
}
