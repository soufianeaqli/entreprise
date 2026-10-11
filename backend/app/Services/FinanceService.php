<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectIncome;
use App\Models\ProjectExpense;

class FinanceService
{
    public function getAllProjects()
    {
        return Project::withCount(['incomes', 'expenses'])->latest()->get();
    }

    public function getProjectById(int $id): Project
    {
        return Project::with(['incomes' => fn($q) => $q->latest(), 'expenses' => fn($q) => $q->latest()])->findOrFail($id);
    }

    public function createProject(array $data): Project
    {
        $project = Project::create($data);
        return $project->fresh(['incomes', 'expenses']);
    }

    public function updateProject(Project $project, array $data): Project
    {
        $project->update($data);
        return $project->fresh(['incomes', 'expenses']);
    }

    public function deleteProject(Project $project): void
    {
        $project->delete();
    }

    public function addIncome(Project $project, array $data): ProjectIncome
    {
        return $project->incomes()->create($data);
    }

    public function deleteIncome(int $incomeId): void
    {
        ProjectIncome::findOrFail($incomeId)->delete();
    }

    public function addExpense(Project $project, array $data): ProjectExpense
    {
        return $project->expenses()->create($data);
    }

    public function deleteExpense(int $expenseId): void
    {
        ProjectExpense::findOrFail($expenseId)->delete();
    }

    public function getDashboardStats(): array
    {
        $projects = Project::all();
        $totalBudget = (float) Project::sum('budget');
        $totalIncomes = (float) ProjectIncome::sum('amount');
        $totalExpenses = (float) ProjectExpense::sum('amount');
        $totalResult = $totalIncomes - $totalExpenses;
        $remainingBudget = $totalBudget - $totalIncomes;

        $profitable = 0;
        $loss = 0;
        foreach ($projects as $project) {
            $income = (float) $project->incomes()->sum('amount');
            $expense = (float) $project->expenses()->sum('amount');
            if ($income - $expense > 0) {
                $profitable++;
            } elseif ($income - $expense < 0 && $income > 0) {
                $loss++;
            }
        }

        return [
            'total_projects' => $projects->count(),
            'total_budget' => $totalBudget,
            'total_incomes' => $totalIncomes,
            'total_expenses' => $totalExpenses,
            'total_result' => $totalResult,
            'total_profit' => $totalResult > 0 ? $totalResult : 0,
            'total_loss' => $totalResult < 0 ? abs($totalResult) : 0,
            'remaining_budget' => $remainingBudget,
            'profitable_projects' => $profitable,
            'loss_projects' => $loss,
        ];
    }
}
