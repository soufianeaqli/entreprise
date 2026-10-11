<?php

namespace App\AI\Tools\Employee;

use App\AI\Tools\Tool;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class GetEmployeeByNameTool implements Tool
{
    public function getName(): string
    {
        return 'get_employee_by_name';
    }

    public function getDescription(): string
    {
        return 'Recherche un employé par nom. Retourne infos détaillées.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'name' => [
                    'type' => 'string',
                    'description' => 'Nom ou partie du nom de l\'employé à rechercher (prénom ou nom)',
                ],
            ],
            'required' => ['name'],
        ];
    }

    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);
        $name = $parameters['name'] ?? '';

        try {
            $query = Employee::with('department', 'contract')
                ->where(function ($q) use ($name) {
                    $q->where('first_name', 'LIKE', "%{$name}%")
                      ->orWhere('last_name', 'LIKE', "%{$name}%");
                });

            // RH scoping
            if ($role === 'rh') {
                $departmentId = $this->getRhDepartmentId($userId);
                if ($departmentId) {
                    $query->where('department_id', $departmentId);
                }
            }

            $employees = $query->limit(10)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $employees->map(fn($e) => [
                'id' => $e->id,
                'matricule' => $e->matricule,
                'full_name' => $e->full_name,
                'email' => $e->email,
                'phone' => $e->phone,
                'position' => $e->position,
                'department' => $e->department?->name,
                'contract_type' => $e->contract_type,
                'salary' => $e->salary ? (float) $e->salary : null,
                'status' => $e->status ? 'Actif' : 'Inactif',
                'hire_date' => $e->hire_date?->format('d/m/Y'),
            ])->toArray();

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'results_count' => count($results),
            ]);

            return ['employees' => $results, 'count' => count($results)];
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
        return 'employees';
    }
}
