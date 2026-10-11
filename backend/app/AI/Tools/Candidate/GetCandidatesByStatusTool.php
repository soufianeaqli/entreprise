<?php

namespace App\AI\Tools\Candidate;

use App\AI\Tools\Tool;
use App\Models\Candidate;
use Illuminate\Support\Facades\Log;

class GetCandidatesByStatusTool implements Tool
{
    public function getName(): string
    {
        return 'get_candidates_by_status';
    }

    public function getDescription(): string
    {
        return 'Candidats filtrés par statut (new, cv_review, interview_scheduled, technical_test, final_interview, accepted, rejected).';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'status' => [
                    'type' => 'string',
                    'enum' => ['new', 'cv_review', 'interview_scheduled', 'technical_test', 'final_interview', 'accepted', 'rejected'],
                    'description' => 'Statut des candidats à rechercher',
                ],
            ],
            'required' => ['status'],
        ];
    }

    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);
        $status = $parameters['status'] ?? 'new';

        try {
            $query = Candidate::with('recruitment', 'department')
                ->where('status', $status);

            // RH scoping
            if ($role === 'rh') {
                $departmentId = $this->getRhDepartmentId($userId);
                if ($departmentId) {
                    $query->where('department_id', $departmentId);
                }
            }

            $candidates = $query->limit(20)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $candidates->map(fn($c) => [
                'id' => $c->id,
                'full_name' => $c->full_name,
                'email' => $c->email,
                'recruitment' => $c->recruitment?->title,
                'department' => $c->department?->name,
                'interview_date' => $c->interview_date?->format('d/m/Y'),
                'created_at' => $c->created_at->format('d/m/Y'),
            ])->toArray();

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'results_count' => count($results),
            ]);

            return [
                'status' => $status,
                'status_label' => Candidate::STATUSES[$status] ?? $status,
                'candidates' => $results,
                'count' => count($results),
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
