<?php

namespace App\AI\Tools\Contract;

use App\AI\Tools\Tool;
use App\Models\Contract;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GetExpiringContractsTool implements Tool
{
    public function getName(): string
    {
        return 'get_expiring_contracts';
    }

    public function getDescription(): string
    {
        return 'Contrats expirant bientôt ou déjà expirés.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'days' => [
                    'type' => 'integer',
                    'description' => 'Nombre de jours pour considérer un contrat comme expirant bientôt (défaut: 30)',
                ],
            ],
            'required' => [],
        ];
    }

    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);
        $days = $parameters['days'] ?? 30;

        try {
            $now = now();
            $futureDate = $now->copy()->addDays($days);

            $query = Contract::where(function ($q) use ($now, $futureDate) {
                // Contracts expiring soon (end_date between now and future)
                $q->whereBetween('end_date', [$now, $futureDate])
                  // OR already expired
                  ->orWhere('end_date', '<', $now);
            })->where('status', '!=', 'expired');

            // RH scoping
            if ($role === 'rh') {
                $departmentName = $this->getRhDepartmentName($userId);
                if ($departmentName) {
                    $query->where('department', $departmentName);
                }
            }

            $contracts = $query->orderBy('end_date', 'asc')->limit(20)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $contracts->map(function ($c) use ($now) {
                $endDate = $c->end_date;
                $daysRemaining = $endDate ? $endDate->diffInDays($now, false) : null;

                return [
                    'id' => $c->id,
                    'employee_name' => $c->employee_name,
                    'type' => $c->type,
                    'department' => $c->department,
                    'end_date' => $endDate?->format('d/m/Y'),
                    'days_remaining' => $daysRemaining !== null ? (int) $daysRemaining : null,
                    'status' => $endDate && $endDate->isPast() ? 'Expiré' : 'Expire bientôt',
                ];
            })->toArray();

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
