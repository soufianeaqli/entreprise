<?php

namespace App\AI\Insights\Analyzers;

use App\AI\Insights\Enums\InsightCategory;
use App\AI\Insights\Enums\InsightSeverity;
use App\AI\Insights\Insight;
use App\Models\Project;

class BudgetAnalyzer implements AnalyzerInterface
{
    public function getName(): string
    {
        return 'budget_analyzer';
    }

    public function analyze(): array
    {
        $insights = [];

        // Projects over budget (expenses > budget)
        $overBudget = Project::where('status', 'in_progress')
            ->get()
            ->filter(function ($project) {
                return $project->total_expenses > $project->budget && $project->budget > 0;
            });

        if ($overBudget->isNotEmpty()) {
            $names = $overBudget->pluck('name')->implode(', ');
            $insights[] = new Insight(
                rule: 'budget_over_budget',
                title: count($overBudget) . ' projet(s) en dépassement budgétaire',
                description: "Les projets suivants dépassent leur budget : {$names}. Analysez les dépenses.",
                severity: InsightSeverity::Critical,
                category: InsightCategory::Budget,
                actions: [
                    ['label' => 'Voir les projets', 'route' => '/finance', 'method' => 'GET'],
                ],
                metadata: [
                    'projects' => $overBudget->map(fn($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'budget' => $p->budget,
                        'expenses' => $p->total_expenses,
                        'overshoot' => $p->total_expenses - $p->budget,
                    ])->toArray(),
                ],
            );
        }

        // Projects using > 80% of budget (warning)
        $almostOverBudget = Project::where('status', 'in_progress')
            ->get()
            ->filter(function ($project) {
                if ($project->budget <= 0) return false;
                $usage = ($project->total_expenses / $project->budget) * 100;
                return $usage >= 80 && $project->total_expenses <= $project->budget;
            });

        if ($almostOverBudget->isNotEmpty()) {
            $names = $almostOverBudget->pluck('name')->implode(', ');
            $insights[] = new Insight(
                rule: 'budget_warning_80pct',
                title: count($almostOverBudget) . ' projet(s) à plus de 80% du budget',
                description: "Les projets {$names} approchent la limite budgétaire. Surveillez les dépenses.",
                severity: InsightSeverity::Warning,
                category: InsightCategory::Budget,
                actions: [
                    ['label' => 'Voir les projets', 'route' => '/finance', 'method' => 'GET'],
                ],
            );
        }

        // Deficit projects (result < 0)
        $deficitProjects = Project::where('status', 'in_progress')
            ->get()
            ->filter(fn($p) => $p->result < 0);

        if ($deficitProjects->isNotEmpty()) {
            $names = $deficitProjects->pluck('name')->implode(', ');
            $insights[] = new Insight(
                rule: 'budget_deficit',
                title: count($deficitProjects) . ' projet(s) déficitaire(s)',
                description: "Les projets {$names} sont en déficit. Examinez les revenus et dépenses.",
                severity: InsightSeverity::Warning,
                category: InsightCategory::Budget,
                actions: [
                    ['label' => 'Voir les projets', 'route' => '/finance', 'method' => 'GET'],
                ],
            );
        }

        // Profitable projects → positive insight
        $profitableProjects = Project::where('status', 'in_progress')
            ->get()
            ->filter(fn($p) => $p->result > 0 && $p->profitability_rate > 20);

        if ($profitableProjects->isNotEmpty()) {
            $names = $profitableProjects->pluck('name')->implode(', ');
            $insights[] = new Insight(
                rule: 'budget_profitable',
                title: count($profitableProjects) . ' projet(s) performant(s)',
                description: "Excellente performance : {$names}. Maintenez cette dynamique.",
                severity: InsightSeverity::Success,
                category: InsightCategory::Budget,
                actions: [
                    ['label' => 'Voir les projets', 'route' => '/finance', 'method' => 'GET'],
                ],
            );
        }

        // Projects without income yet
        $noIncome = Project::where('status', 'in_progress')
            ->whereHas('expenses')
            ->whereDoesntHave('incomes')
            ->count();

        if ($noIncome > 0) {
            $insights[] = new Insight(
                rule: 'budget_no_income',
                title: $noIncome . ' projet(s) avec dépenses mais sans revenus',
                description: 'Ces projets ont des dépenses enregistrées mais aucun revenu. Vérifiez la situation.',
                severity: InsightSeverity::Warning,
                category: InsightCategory::Budget,
                actions: [
                    ['label' => 'Voir les projets', 'route' => '/finance', 'method' => 'GET'],
                ],
            );
        }

        return $insights;
    }
}
