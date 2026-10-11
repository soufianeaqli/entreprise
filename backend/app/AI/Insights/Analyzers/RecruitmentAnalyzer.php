<?php

namespace App\AI\Insights\Analyzers;

use App\AI\Insights\Enums\InsightCategory;
use App\AI\Insights\Enums\InsightSeverity;
use App\AI\Insights\Insight;
use App\Models\Recruitment;
use Carbon\Carbon;

class RecruitmentAnalyzer implements AnalyzerInterface
{
    public function getName(): string
    {
        return 'recruitment_analyzer';
    }

    public function analyze(): array
    {
        $insights = [];

        // Published recruitments with 0 applications
        $noApplications = Recruitment::where('status', 'published')
            ->where('applications_count', 0)
            ->get();

        if ($noApplications->isNotEmpty()) {
            $titles = $noApplications->pluck('title')->implode(', ');
            $insights[] = new Insight(
                rule: 'recruitment_no_applications',
                title: count($noApplications) . ' annonce(s) sans candidature',
                description: "Les annonces suivantes n'ont reçu aucune candidature : {$titles}. Envisagez de modifier la description ou de republier.",
                severity: InsightSeverity::Warning,
                category: InsightCategory::Recruitment,
                actions: [
                    ['label' => 'Voir les annonces', 'route' => '/recruitments', 'method' => 'GET'],
                ],
                metadata: [
                    'recruitments' => $noApplications->map(fn($r) => [
                        'id' => $r->id,
                        'title' => $r->title,
                        'posted_date' => $r->posted_date,
                    ])->toArray(),
                ],
            );
        }

        // Published recruitments with very few applications (< 3)
        $fewApplications = Recruitment::where('status', 'published')
            ->where('applications_count', '>', 0)
            ->where('applications_count', '<', 3)
            ->get();

        if ($fewApplications->isNotEmpty()) {
            $insights[] = new Insight(
                rule: 'recruitment_few_applications',
                title: count($fewApplications) . ' annonce(s) avec peu de candidatures',
                description: 'Ces annonces ont moins de 3 candidatures. Augmentez la visibilité ou élargissez les critères.',
                severity: InsightSeverity::Info,
                category: InsightCategory::Recruitment,
                actions: [
                    ['label' => 'Voir les annonces', 'route' => '/recruitments', 'method' => 'GET'],
                ],
            );
        }

        // Recruitments deadline approaching (within 7 days)
        $deadlineSoon = Recruitment::where('status', 'published')
            ->whereNotNull('deadline')
            ->where('deadline', '>=', Carbon::now())
            ->where('deadline', '<=', Carbon::now()->addDays(7))
            ->get();

        if ($deadlineSoon->isNotEmpty()) {
            $titles = $deadlineSoon->pluck('title')->implode(', ');
            $insights[] = new Insight(
                rule: 'recruitment_deadline_approaching',
                title: count($deadlineSoon) . ' annonce(s) bientôt expirées',
                description: "Les annonces {$titles} arrivent à échéance. Prolongez ou archivez-les.",
                severity: InsightSeverity::Warning,
                category: InsightCategory::Recruitment,
                actions: [
                    ['label' => 'Voir les annonces', 'route' => '/recruitments', 'method' => 'GET'],
                ],
            );
        }

        // Very successful recruitments (> 10 applications)
        $successful = Recruitment::where('status', 'published')
            ->where('applications_count', '>', 10)
            ->get();

        if ($successful->isNotEmpty()) {
            $titles = $successful->pluck('title')->implode(', ');
            $insights[] = new Insight(
                rule: 'recruitment_high_performance',
                title: count($successful) . ' annonce(s) très performante(s)',
                description: "Excellentes annonces : {$titles}. Procédez au tri des candidatures.",
                severity: InsightSeverity::Success,
                category: InsightCategory::Recruitment,
                actions: [
                    ['label' => 'Voir les annonces', 'route' => '/recruitments', 'method' => 'GET'],
                ],
            );
        }

        // Pending candidates awaiting status update (interview_scheduled but no date)
        $pendingInterview = \App\Models\Candidate::where('status', 'interview_scheduled')
            ->whereNull('interview_date')
            ->count();

        if ($pendingInterview > 0) {
            $insights[] = new Insight(
                rule: 'recruitment_pending_interviews',
                title: $pendingInterview . ' candidature(s) en attente de planification',
                description: 'Des candidats ont un entretien programmé mais sans date fixée. Planifiez les entretiens.',
                severity: InsightSeverity::Warning,
                category: InsightCategory::Recruitment,
                actions: [
                    ['label' => 'Voir les candidats', 'route' => '/recruitments', 'method' => 'GET'],
                ],
            );
        }

        return $insights;
    }
}
