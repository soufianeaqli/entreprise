<?php

namespace App\AI\Tools\Candidate;

use App\AI\Tools\Tool;
use App\Models\Candidate;
use Illuminate\Support\Facades\Log;

class GetCandidateByNameTool implements Tool
{
    public function getName(): string
    {
        return 'get_candidate_by_name';
    }

    public function getDescription(): string
    {
        return 'Recherche un candidat par nom.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'name' => [
                    'type' => 'string',
                    'description' => 'Nom ou partie du nom du candidat à rechercher',
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
            $query = Candidate::with('recruitment', 'department')
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

            $candidates = $query->limit(10)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $candidates->map(fn($c) => [
                'id' => $c->id,
                'full_name' => $c->full_name,
                'email' => $c->email,
                'phone' => $c->phone,
                'status' => $c->status_label,
                'recruitment' => $c->recruitment?->title,
                'department' => $c->department?->name,
                'interview_date' => $c->interview_date?->format('d/m/Y'),
                'interview_time' => $c->interview_time,
                'created_at' => $c->created_at->format('d/m/Y'),
            ])->toArray();

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'results_count' => count($results),
            ]);

            return ['candidates' => $results, 'count' => count($results)];
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
