<?php

namespace App\AI\Tools\Employee;

use App\AI\Tools\Tool;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmployeeCountTool implements Tool
{
    public function getName(): string
    {
        return 'get_employees_count';
    }

    public function getDescription(): string
    {
        return 'Nombre total d\'employés (actifs/inactifs).';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [],
            'required' => [],
        ];
    }

    /**
     * Exécute le tool : récupère le nombre total d'employés.
     */
    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);

        try {
            $total = Employee::count();
            $active = Employee::where('status', true)->count();
            $inactive = Employee::where('status', false)->count();

            $duration = round((microtime(true) - $start) * 1000, 2);

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'result' => ['total' => $total, 'active' => $active, 'inactive' => $inactive],
            ]);

            return [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
            ];
        } catch (\Throwable $e) {
            $duration = round((microtime(true) - $start) * 1000, 2);

            Log::error('AI Tool failed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => false,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
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
