<?php

namespace App\AI\Tools\Contract;

use App\AI\Tools\Tool;
use App\Models\Contract;
use Illuminate\Support\Facades\Log;

class GetContractsTool implements Tool
{
    public function getName(): string
    {
        return 'get_contracts';
    }

    public function getDescription(): string
    {
        return 'Contrats de travail filtrés (statut, type).';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'status' => [
                    'type' => 'string',
                    'enum' => ['active', 'expired', 'pending'],
                    'description' => 'Statut du contrat',
                ],
                'type' => [
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
            $query = Contract::query();

            if (!empty($parameters['status'])) {
                $query->where('status', $parameters['status']);
            }

            if (!empty($parameters['type'])) {
                $query->where('type', $parameters['type']);
            }

            // RH scoping: filter by department name
            if ($role === 'rh') {
                $departmentName = $this->getRhDepartmentName($userId);
                if ($departmentName) {
                    $query->where('department', $departmentName);
                }
            }

            $contracts = $query->limit(20)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $contracts->map(fn($c) => [
                'id' => $c->id,
                'employee_name' => $c->employee_name,
                'type' => $c->type,
                'department' => $c->department,
                'start_date' => $c->start_date?->format('d/m/Y'),
                'end_date' => $c->end_date?->format('d/m/Y'),
                'salary' => $c->salary ? (float) $c->salary : null,
                'status' => $c->status,
            ])->toArray();

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'results_count' => count($results),
            ]);

            return ['contracts' => $results, 'count' => count($results)];
        } catch (\Throwable $e) {
            Log::error('AI Tool failed', ['tool' => $this->getName(), 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function getRhDepartmentName(int $userId): ?string
    {
        $user = \App\Models\User::find($userId);
        return $user?->rhManager?->department?->name;
    }

    public function requiresConfirmation(): bool
    {
        return false;
    }

    public function getCategory(): string
    {
        return 'contracts';
    }
}
