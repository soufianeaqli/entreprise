<?php

namespace App\AI\Tools\Employee;

use App\AI\Tools\Tool;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class SearchEmployeesTool implements Tool
{
    public function getName(): string
    {
        return 'search_employees';
    }

    public function getDescription(): string
    {
        return 'Liste/filtre les employés (département, statut, contrat).';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'department' => [
                    'type' => 'string',
                    'description' => 'Nom du département pour filtrer',
                ],
                'status' => [
                    'type' => 'string',
                    'enum' => ['active', 'inactive'],
                    'description' => 'Statut de l\'employé',
                ],
                'contract_type' => [
                    'type' => 'string',
                    'enum' => ['CDI', 'CDD', 'Stage'],
                    'description' => 'Type de contrat',
                ],
            ],
            'required' => [],
        ];
    }

    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);

        try {
            $query = Employee::with('department');

            if (!empty($parameters['department'])) {
                $query->whereHas('department', function ($q) use ($parameters) {
                    $q->where('name', 'LIKE', "%{$parameters['department']}%");
                });
            }

            if (!empty($parameters['status'])) {
                $query->where('status', $parameters['status'] === 'active');
            }

            if (!empty($parameters['contract_type'])) {
                $query->where('contract_type', $parameters['contract_type']);
            }

            // RH scoping
            if ($role === 'rh') {
                $departmentId = $this->getRhDepartmentId($userId);
                if ($departmentId) {
                    $query->where('department_id', $departmentId);
                }
            }

            $employees = $query->limit(20)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $employees->map(fn($e) => [
                'id' => $e->id,
                'matricule' => $e->matricule,
                'full_name' => $e->full_name,
                'email' => $e->email,
                'position' => $e->position,
                'department' => $e->department?->name,
                'contract_type' => $e->contract_type,
                'status' => $e->status ? 'Actif' : 'Inactif',
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
