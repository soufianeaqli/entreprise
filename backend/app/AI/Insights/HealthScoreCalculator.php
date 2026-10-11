<?php

namespace App\AI\Insights;

use App\Models\Candidate;
use App\Models\Contract;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Meeting;
use App\Models\Project;
use App\Models\Recruitment;

class HealthScoreCalculator
{
    /**
     * Calcule le score global de santé de l'entreprise (0-100).
     *
     * @return array{score: int, breakdown: array<string, array{label: string, score: int, max: int, reason: string}>}
     */
    public function calculate(): array
    {
        $breakdown = [];

        // 1. Documents completeness (0-20 points)
        $breakdown['documents'] = $this->scoreDocuments();

        // 2. Contracts validity (0-20 points)
        $breakdown['contracts'] = $this->scoreContracts();

        // 3. Recruitment health (0-20 points)
        $breakdown['recruitment'] = $this->scoreRecruitment();

        // 4. Budget management (0-20 points)
        $breakdown['budget'] = $this->scoreBudget();

        // 5. Meetings follow-up (0-20 points)
        $breakdown['meetings'] = $this->scoreMeetings();

        $total = array_sum(array_column($breakdown, 'score'));

        return [
            'score' => min(100, max(0, $total)),
            'breakdown' => $breakdown,
        ];
    }

    private function scoreDocuments(): array
    {
        $totalActive = Employee::where('status', true)->count();
        if ($totalActive === 0) {
            return ['label' => 'Documents', 'score' => 20, 'max' => 20, 'reason' => 'Aucun employé actif'];
        }

        $withDocs = Employee::where('status', true)
            ->whereHas('documents')
            ->count();

        $score = (int) round(($withDocs / $totalActive) * 20);

        $missing = $totalActive - $withDocs;
        $reason = $missing > 0
            ? "{$missing} employé(s) sans documents"
            : 'Tous les employés ont des documents';

        return ['label' => 'Documents', 'score' => $score, 'max' => 20, 'reason' => $reason];
    }

    private function scoreContracts(): array
    {
        $activeContracts = Contract::where('status', 'active')->count();
        $totalContracts = Contract::count();

        if ($totalContracts === 0) {
            return ['label' => 'Contrats', 'score' => 20, 'max' => 20, 'reason' => 'Aucun contrat'];
        }

        // Check for expired but still active
        $expired = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<', now())
            ->count();

        // Check for expiring soon
        $expiringSoon = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '>=', now())
            ->where('end_date', '<=', now()->addDays(30))
            ->count();

        $score = 20;
        $penalty = ($expired * 5) + ($expiringSoon * 2);
        $score = max(0, $score - $penalty);

        $reasons = [];
        if ($expired > 0) $reasons[] = "{$expired} contrat(s) expiré(s)";
        if ($expiringSoon > 0) $reasons[] = "{$expiringSoon} contrat(s) expirant bientôt";
        $reason = $reasons ? implode(', ', $reasons) : 'Contrats à jour';

        return ['label' => 'Contrats', 'score' => $score, 'max' => 20, 'reason' => $reason];
    }

    private function scoreRecruitment(): array
    {
        $published = Recruitment::where('status', 'published')->count();
        $totalCandidates = Candidate::count();
        $pendingCandidates = Candidate::whereIn('status', ['new', 'cv_review'])->count();

        $score = 20;

        if ($published === 0 && $totalCandidates === 0) {
            return ['label' => 'Recrutement', 'score' => 20, 'max' => 20, 'reason' => 'Aucune activité de recrutement'];
        }

        // Penalty for too many pending candidates
        if ($pendingCandidates > 20) $score -= 10;
        elseif ($pendingCandidates > 10) $score -= 5;

        // Bonus for having published recruitments
        if ($published > 0) $score = min(20, $score + 2);

        $score = max(0, $score);
        $reason = $pendingCandidates > 0
            ? "{$pendingCandidates} candidature(s) en attente"
            : 'Recrutement géré';

        return ['label' => 'Recrutement', 'score' => $score, 'max' => 20, 'reason' => $reason];
    }

    private function scoreBudget(): array
    {
        $projects = Project::where('status', 'in_progress')->get();

        if ($projects->isEmpty()) {
            return ['label' => 'Budget', 'score' => 20, 'max' => 20, 'reason' => 'Aucun projet actif'];
        }

        $score = 20;
        $overBudget = 0;
        $almostOver = 0;

        foreach ($projects as $project) {
            if ($project->budget > 0) {
                $usage = ($project->total_expenses / $project->budget) * 100;
                if ($usage > 100) $overBudget++;
                elseif ($usage > 80) $almostOver++;
            }
            if ($project->result < 0) $score -= 3;
        }

        $score -= ($overBudget * 5) + ($almostOver * 2);
        $score = max(0, $score);

        $reasons = [];
        if ($overBudget > 0) $reasons[] = "{$overBudget} projet(s) en dépassement";
        if ($almostOver > 0) $reasons[] = "{$almostOver} projet(s) proche du budget";
        $reason = $reasons ? implode(', ', $reasons) : 'Budget maîtrisé';

        return ['label' => 'Budget', 'score' => $score, 'max' => 20, 'reason' => $reason];
    }

    private function scoreMeetings(): array
    {
        $completed = Meeting::where('status', 'completed')->count();
        $completedNoMinutes = Meeting::where('status', 'completed')
            ->whereNull('minutes_summary')
            ->count();

        if ($completed === 0) {
            return ['label' => 'Réunions', 'score' => 20, 'max' => 20, 'reason' => 'Aucune réunion clôturée'];
        }

        $withMinutes = $completed - $completedNoMinutes;
        $score = (int) round(($withMinutes / $completed) * 20);

        $reason = $completedNoMinutes > 0
            ? "{$completedNoMinutes} réunion(s) sans compte rendu"
            : 'Toutes les réunions ont un compte rendu';

        return ['label' => 'Réunions', 'score' => $score, 'max' => 20, 'reason' => $reason];
    }
}
