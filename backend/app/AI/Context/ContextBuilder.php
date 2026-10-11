<?php

namespace App\AI\Context;

use App\Models\Employee;
use App\Models\Department;
use App\Models\Recruitment;
use App\Models\Candidate;
use App\Models\Contract;
use App\Models\Meeting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ContextBuilder
{
    private const CACHE_TTL = 300; // 5 minutes for stats cache

    /**
     * Build complete context for an AI call.
     */
    public function build(User $user, string $message): array
    {
        $context = [
            'user' => $this->buildUserContext($user),
            'application' => $this->buildApplicationContext($user),
            'alerts' => $this->buildAlerts($user),
            'datetime' => $this->buildDatetimeContext(),
        ];

        Log::info('AI Context built', [
            'user_id' => $user->id,
            'role' => $user->role,
            'alerts_count' => count($context['alerts']),
        ]);

        return $context;
    }

    /**
     * Format context as a string for the system prompt.
     */
    public function formatForPrompt(array $context): string
    {
        $sections = [];

        // User section
        $u = $context['user'];
        $sections[] = "## Utilisateur connecté\n- Nom: {$u['name']}\n- Rôle: {$u['role_label']}\n- Email: {$u['email']}";
        if ($u['department']) {
            $sections[] .= "- Département: {$u['department']}";
        }

        // Application stats
        $app = $context['application'];
        $sections[] = "## État de l'application\n"
            . "- Employés: {$app['employees_total']} ({$app['employees_active']} actifs)\n"
            . "- Départements: {$app['departments_count']}\n"
            . "- RH Managers: {$app['rh_count']}\n"
            . "- Candidatures: {$app['candidates_total']} ({$app['candidates_pending']} en attente)\n"
            . "- Recrutements actifs: {$app['recruitments_active']}\n"
            . "- Contrats actifs: {$app['contracts_active']}\n"
            . "- Réunions aujourd'hui: {$app['meetings_today']}\n"
            . "- Réunions à venir: {$app['meetings_upcoming']}";

        // Add detailed entity listings for reference
        $departments = Department::select('id', 'name', 'code')->get();
        if ($departments->isNotEmpty()) {
            $deptLines = $departments->map(fn($d) => "- ID {$d->id}: {$d->name} ({$d->code})")->implode("\n");
            $sections[] = "## Départements existants\n{$deptLines}";
        }

        // Alerts
        if (!empty($context['alerts'])) {
            $alertLines = array_map(fn($a) => "- [{$a['severity']}] {$a['message']}", $context['alerts']);
            $sections[] = "## Alertes prioritaires\n" . implode("\n", $alertLines);
        }

        // Datetime
        $dt = $context['datetime'];
        $sections[] = "## Date/Heure\n{$dt['current']} ({$dt['day_of_week']})";

        return implode("\n\n", $sections);
    }

    private function buildUserContext(User $user): array
    {
        $department = null;
        if ($user->role === 'rh') {
            $department = $user->rhManager?->department?->name;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'role_label' => match ($user->role) {
                'super_admin' => 'Super Administrateur',
                'rh' => 'Responsable RH',
                'candidate' => 'Candidat',
                default => $user->role,
            },
            'department' => $department,
            'is_active' => $user->is_active,
        ];
    }

    private function buildApplicationContext(User $user): array
    {
        $cacheKey = "ai_app_context_{$user->role}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            $deptId = $user->role === 'rh' ? $user->rhManager?->department?->id : null;

            $employeeQuery = Employee::query();
            if ($deptId) {
                $employeeQuery->where('department_id', $deptId);
            }

            return [
                'employees_total' => $employeeQuery->count(),
                'employees_active' => (clone $employeeQuery)->where('status', true)->count(),
                'departments_count' => Department::count(),
                'rh_count' => \App\Models\RhManager::count(),
                'candidates_total' => Candidate::count(),
                'candidates_pending' => Candidate::whereIn('status', ['new', 'cv_review'])->count(),
                'recruitments_active' => Recruitment::where('status', 'published')->count(),
                'contracts_active' => Contract::where('status', 'active')->count(),
                'meetings_today' => Meeting::whereDate('date', now()->toDateString())->count(),
                'meetings_upcoming' => Meeting::where('date', '>=', now()->toDateString())->where('status', 'scheduled')->count(),
            ];
        });
    }

    private function buildAlerts(User $user): array
    {
        $alerts = [];

        try {
            // Expiring contracts
            $expiringCount = Contract::where('status', 'active')
                ->whereNotNull('end_date')
                ->whereBetween('end_date', [now(), now()->addDays(30)])
                ->count();
            if ($expiringCount > 0) {
                $alerts[] = [
                    'type' => 'contracts_expiring',
                    'severity' => 'warning',
                    'message' => "{$expiringCount} contrat(s) expirent dans les 30 prochains jours",
                ];
            }

            // Pending candidates
            $pendingCount = Candidate::whereIn('status', ['new', 'cv_review'])->count();
            if ($pendingCount > 0) {
                $alerts[] = [
                    'type' => 'candidates_pending',
                    'severity' => 'info',
                    'message' => "{$pendingCount} candidature(s) en attente de traitement",
                ];
            }

            // Today's meetings
            $todayMeetings = Meeting::whereDate('date', now()->toDateString())
                ->where('status', 'scheduled')
                ->count();
            if ($todayMeetings > 0) {
                $alerts[] = [
                    'type' => 'meetings_today',
                    'severity' => 'info',
                    'message' => "{$todayMeetings} réunion(s) prévue(s) aujourd'hui",
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('ContextBuilder alerts failed', ['error' => $e->getMessage()]);
        }

        return $alerts;
    }

    private function buildDatetimeContext(): array
    {
        $now = now();
        return [
            'current' => $now->format('d/m/Y à H:i'),
            'day_of_week' => $now->translatedFormat('l'),
            'date' => $now->format('Y-m-d'),
            'time' => $now->format('H:i'),
        ];
    }
}
