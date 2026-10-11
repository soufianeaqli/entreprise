<?php

namespace App\AI\Insights\Analyzers;

use App\AI\Insights\Enums\InsightCategory;
use App\AI\Insights\Enums\InsightSeverity;
use App\AI\Insights\Insight;
use App\Models\Candidate;
use App\Models\Recruitment;
use App\Models\RhManager;

class RhAnalyzer implements AnalyzerInterface
{
    public function getName(): string
    {
        return 'rh_analyzer';
    }

    public function analyze(): array
    {
        $insights = [];

        // RH with many pending candidates (> 10 candidates in 'new' status)
        $rhManagers = RhManager::where('status', true)->get();

        foreach ($rhManagers as $rh) {
            $deptId = $rh->department_id;

            if (!$deptId) continue;

            // Count new candidates for this RH's department
            $pendingCandidates = Candidate::where('department_id', $deptId)
                ->where('status', 'new')
                ->count();

            if ($pendingCandidates >= 10) {
                $insights[] = new Insight(
                    rule: 'rh_overloaded_candidates',
                    title: $rh->full_name . ' a ' . $pendingCandidates . ' candidatures en attente',
                    description: "Le RH {$rh->full_name} a beaucoup de candidatures non traitées. Redistribution ou acceleration recommandée.",
                    severity: InsightSeverity::Warning,
                    category: InsightCategory::Rh,
                    actions: [
                        ['label' => 'Voir les candidats', 'route' => '/recruitments', 'method' => 'GET'],
                    ],
                    metadata: [
                        'rh_manager_id' => $rh->id,
                        'pending_count' => $pendingCandidates,
                    ],
                );
            }

            // RH with no active recruitment
            $activeRecruitments = Recruitment::where('rh_manager_id', $rh->id)
                ->where('status', 'published')
                ->count();

            if ($activeRecruitments === 0 && $pendingCandidates === 0) {
                $insights[] = new Insight(
                    rule: 'rh_no_active_recruitment',
                    title: $rh->full_name . ' n\'a aucune annonce active',
                    description: 'Ce RH n\'a pas de recrutement en cours. Vérifiez si une affectation est nécessaire.',
                    severity: InsightSeverity::Info,
                    category: InsightCategory::Rh,
                    actions: [
                        ['label' => 'Voir les RH', 'route' => '/rh-managers', 'method' => 'GET'],
                    ],
                );
            }
        }

        return $insights;
    }
}
