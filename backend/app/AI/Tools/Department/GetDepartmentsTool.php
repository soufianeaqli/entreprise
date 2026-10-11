<?php

namespace App\AI\Tools\Department;

use App\AI\Tools\Tool;
use App\Models\Department;
use Illuminate\Support\Facades\Log;

class GetDepartmentsTool implements Tool
{
    public function getName(): string
    {
        return 'get_departments';
    }

    public function getDescription(): string
    {
        return 'Liste tous les départements avec infos.';
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
            $query = Department::with('rhManager');

            // RH sees only their department
            if ($role === 'rh') {
                $departmentId = $this->getRhDepartmentId($userId);
                if ($departmentId) {
                    $query->where('id', $departmentId);
                }
            }

            $departments = $query->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $departments->map(fn($d) => [
                'id' => $d->id,
                'name' => $d->name,
                'code' => $d->code,
                'employees_count' => $d->employees_count,
                'annual_budget' => $d->annual_budget ? (float) $d->annual_budget : null,
                'location' => $d->location,
                'rh_manager' => $d->rhManager?->full_name,
                'status' => $d->status ? 'Actif' : 'Inactif',
            ])->toArray();

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'results_count' => count($results),
            ]);

            return ['departments' => $results, 'count' => count($results)];
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
        return 'departments';
    }
}
