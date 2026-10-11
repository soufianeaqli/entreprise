<?php

namespace App\AI\Insights\Analyzers;

use App\AI\Insights\Enums\InsightCategory;
use App\AI\Insights\Enums\InsightSeverity;
use App\AI\Insights\Insight;
use App\Models\Contract;
use Carbon\Carbon;

class ContractAnalyzer implements AnalyzerInterface
{
    public function getName(): string
    {
        return 'contract_analyzer';
    }

    public function analyze(): array
    {
        $insights = [];

        // Contracts expiring in 30 days
        $expiringSoon = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '>=', Carbon::now())
            ->where('end_date', '<=', Carbon::now()->addDays(30))
            ->with('rhManager:id,first_name,last_name')
            ->get();

        if ($expiringSoon->isNotEmpty()) {
            $titles = $expiringSoon->pluck('employee_name')->implode(', ');
            $insights[] = new Insight(
                rule: 'contract_expiring_30d',
                title: count($expiringSoon) . ' contrat(s) expirant dans 30 jours',
                description: "Les contrats suivants arrivent à échéance : {$titles}. Préparez les renouvellements.",
                severity: InsightSeverity::Warning,
                category: InsightCategory::Contract,
                actions: [
                    ['label' => 'Voir les contrats', 'route' => '/contracts', 'method' => 'GET'],
                ],
                metadata: [
                    'contracts' => $expiringSoon->map(fn($c) => [
                        'id' => $c->id,
                        'employee_name' => $c->employee_name,
                        'end_date' => $c->end_date,
                        'type' => $c->type,
                    ])->toArray(),
                ],
            );
        }

        // Contracts expiring in 15 days → critical
        $criticalExpiring = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '>=', Carbon::now())
            ->where('end_date', '<=', Carbon::now()->addDays(15))
            ->count();

        if ($criticalExpiring > 0) {
            $insights[] = new Insight(
                rule: 'contract_expiring_15d',
                title: $criticalExpiring . ' contrat(s) expirent dans moins de 15 jours',
                description: 'Action urgente requise : ces contrats nécessitent un renouvellement immédiat.',
                severity: InsightSeverity::Critical,
                category: InsightCategory::Contract,
                actions: [
                    ['label' => 'Voir les contrats', 'route' => '/contracts', 'method' => 'GET'],
                ],
            );
        }

        // Expired contracts still active
        $expired = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<', Carbon::now())
            ->count();

        if ($expired > 0) {
            $insights[] = new Insight(
                rule: 'contract_expired',
                title: $expired . ' contrat(s) expiré(s)',
                description: 'Des contrats ont expiré mais sont encore marqués comme actifs. Mettez à jour leur statut.',
                severity: InsightSeverity::Critical,
                category: InsightCategory::Contract,
                actions: [
                    ['label' => 'Voir les contrats', 'route' => '/contracts', 'method' => 'GET'],
                ],
            );
        }

        // Trial periods ending
        $trialEnding = Contract::where('status', 'active')
            ->whereNotNull('trial_period')
            ->whereNotNull('start_date')
            ->get()
            ->filter(function ($contract) {
                $trialDays = (int) preg_replace('/\D/', '', $contract->trial_period) ?: 90;
                $trialEnd = Carbon::parse($contract->start_date)->addDays($trialDays);
                return $trialEnd->gte(Carbon::now()) && $trialEnd->lte(Carbon::now()->addDays(7));
            });

        if ($trialEnding->isNotEmpty()) {
            $names = $trialEnding->pluck('employee_name')->implode(', ');
            $insights[] = new Insight(
                rule: 'contract_trial_ending',
                title: count($trialEnding) . ' période(s) d\'essai arrivant à leur fin',
                description: "Les périodes d'essai de {$names} se terminent bientôt. Programmez les entretiens d'évaluation.",
                severity: InsightSeverity::Warning,
                category: InsightCategory::Contract,
                actions: [
                    ['label' => 'Voir les contrats', 'route' => '/contracts', 'method' => 'GET'],
                ],
            );
        }

        return $insights;
    }
}
