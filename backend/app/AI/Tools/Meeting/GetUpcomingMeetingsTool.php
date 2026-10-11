<?php

namespace App\AI\Tools\Meeting;

use App\AI\Tools\Tool;
use App\Models\Meeting;
use Illuminate\Support\Facades\Log;

class GetUpcomingMeetingsTool implements Tool
{
    public function getName(): string
    {
        return 'get_upcoming_meetings';
    }

    public function getDescription(): string
    {
        return 'Prochaines réunions planifiées.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'days' => [
                    'type' => 'integer',
                    'description' => 'Nombre de jours à venir à considérer (défaut: 7)',
                ],
            ],
            'required' => [],
        ];
    }

    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);
        $days = $parameters['days'] ?? 7;

        try {
            $query = Meeting::with('department', 'rhManager', 'participants')
                ->whereBetween('date', [now()->toDateString(), now()->addDays($days)->toDateString()])
                ->orderBy('date', 'asc')
                ->orderBy('start_time', 'asc');

            // RH scoping
            if ($role === 'rh') {
                $departmentId = $this->getRhDepartmentId($userId);
                if ($departmentId) {
                    $query->where('department_id', $departmentId);
                }
            }

            $meetings = $query->limit(20)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $meetings->map(fn($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'type' => $m->type,
                'date' => $m->date->format('d/m/Y'),
                'start_time' => $m->start_time,
                'end_time' => $m->end_time,
                'location' => $m->location,
                'priority' => $m->priority,
                'status' => $m->status,
                'department' => $m->department?->name,
                'participants_count' => $m->participants->count(),
            ])->toArray();

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'results_count' => count($results),
            ]);

            return ['meetings' => $results, 'count' => count($results), 'period' => "Prochains {$days} jours"];
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
        return 'meetings';
    }
}
