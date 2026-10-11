<?php

namespace App\AI\Insights\Analyzers;

use App\AI\Insights\Enums\InsightCategory;
use App\AI\Insights\Enums\InsightSeverity;
use App\AI\Insights\Insight;
use App\Models\Meeting;
use Carbon\Carbon;

class MeetingAnalyzer implements AnalyzerInterface
{
    public function getName(): string
    {
        return 'meeting_analyzer';
    }

    public function analyze(): array
    {
        $insights = [];

        // Completed meetings without minutes/summary
        $completedNoMinutes = Meeting::where('status', 'completed')
            ->whereNull('minutes_summary')
            ->count();

        if ($completedNoMinutes > 0) {
            $insights[] = new Insight(
                rule: 'meeting_missing_minutes',
                title: $completedNoMinutes . ' réunion(s) sans compte rendu',
                description: 'Des réunions terminées n\'ont pas de compte rendu. Rédigez les comptes rendus pour garder une trace.',
                severity: InsightSeverity::Warning,
                category: InsightCategory::Meeting,
                actions: [
                    ['label' => 'Voir les réunions', 'route' => '/meetings', 'method' => 'GET'],
                ],
            );
        }

        // Meetings without decisions
        $completedNoDecisions = Meeting::where('status', 'completed')
            ->whereDoesntHave('decisions')
            ->count();

        if ($completedNoDecisions > 0) {
            $insights[] = new Insight(
                rule: 'meeting_missing_decisions',
                title: $completedNoDecisions . ' réunion(s) sans décisions enregistrées',
                description: 'Ces réunions n\'ont pas de décisions formalisées. Ajoutez les décisions pour le suivi.',
                severity: InsightSeverity::Info,
                category: InsightCategory::Meeting,
                actions: [
                    ['label' => 'Voir les réunions', 'route' => '/meetings', 'method' => 'GET'],
                ],
            );
        }

        // Upcoming meetings (today and tomorrow)
        $upcoming = Meeting::where('status', 'scheduled')
            ->whereBetween('date', [Carbon::today(), Carbon::tomorrow()])
            ->count();

        if ($upcoming > 0) {
            $insights[] = new Insight(
                rule: 'meeting_upcoming',
                title: $upcoming . ' réunion(s) prévue(s) bientôt',
                description: 'Des réunions sont prévues pour aujourd\'hui ou demain. Vérifiez les préparatifs.',
                severity: InsightSeverity::Info,
                category: InsightCategory::Meeting,
                actions: [
                    ['label' => 'Voir les réunions', 'route' => '/meetings', 'method' => 'GET'],
                ],
            );
        }

        // Urgent priority meetings scheduled
        $urgentMeetings = Meeting::where('status', 'scheduled')
            ->where('priority', 'urgent')
            ->count();

        if ($urgentMeetings > 0) {
            $insights[] = new Insight(
                rule: 'meeting_urgent',
                title: $urgentMeetings . ' réunion(s) urgente(s) planifiée(s)',
                description: 'Des réunions prioritaires urgentes sont à venir. Assurez-vous de la participation.',
                severity: InsightSeverity::Critical,
                category: InsightCategory::Meeting,
                actions: [
                    ['label' => 'Voir les réunions', 'route' => '/meetings', 'method' => 'GET'],
                ],
            );
        }

        // Cancelled meetings
        $cancelled = Meeting::where('status', 'cancelled')
            ->where('date', '>=', Carbon::today())
            ->count();

        if ($cancelled > 0) {
            $insights[] = new Insight(
                rule: 'meeting_cancelled',
                title: $cancelled . ' réunion(s) annulée(s)',
                description: 'Des réunions à venir ont été annulées. Vérifiez si un report est nécessaire.',
                severity: InsightSeverity::Info,
                category: InsightCategory::Meeting,
                actions: [
                    ['label' => 'Voir les réunions', 'route' => '/meetings', 'method' => 'GET'],
                ],
            );
        }

        return $insights;
    }
}
