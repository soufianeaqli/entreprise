<?php

namespace App\AI\Tools\Recruitment;

use App\AI\Tools\Tool;
use App\Models\Recruitment;
use Illuminate\Support\Facades\Log;

class GetRecruitmentAnnouncementsTool implements Tool
{
    public function getName(): string
    {
        return 'get_recruitment_announcements';
    }

    public function getDescription(): string
    {
        return 'Annonces de recrutement actives.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'status' => [
                    'type' => 'string',
                    'enum' => ['published', 'draft', 'closed', 'archived'],
                    'description' => 'Statut de l\'annonce (défaut: published)',
                ],
            ],
            'required' => [],
        ];
    }

    public function execute(array $parameters, int $userId, string $role): array
    {
        $start = microtime(true);
        $status = $parameters['status'] ?? 'published';

        try {
            $query = Recruitment::with('department', 'rhManager')
                ->where('status', $status);

            // RH scoping
            if ($role === 'rh') {
                $departmentId = $this->getRhDepartmentId($userId);
                if ($departmentId) {
                    $query->where('department_id', $departmentId);
                }
            }

            $recruitments = $query->orderBy('posted_date', 'desc')->limit(20)->get();

            $duration = round((microtime(true) - $start) * 1000, 2);

            $results = $recruitments->map(fn($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'department' => $r->department?->name,
                'contract_type' => $r->contract_type,
                'location' => $r->location,
                'work_mode' => $r->work_mode,
                'positions_count' => $r->positions_count,
                'salary' => $r->salary ? (float) $r->salary : null,
                'posted_date' => $r->posted_date?->format('d/m/Y'),
                'deadline' => $r->deadline?->format('d/m/Y'),
                'applications_count' => $r->applications_count,
                'status' => $r->status,
            ])->toArray();

            Log::info('AI Tool executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'results_count' => count($results),
            ]);

            return ['announcements' => $results, 'count' => count($results)];
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
        return 'recruitment';
    }
}
