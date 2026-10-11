<?php

namespace App\Services;

use App\Models\RhManager;
use App\Models\Department;
use App\Models\Recruitment;
use App\Models\Contract;
use App\Models\Project;
use App\Models\ProjectIncome;
use App\Models\ProjectExpense;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsService
{
    public function getKPIs(string $period = '12m'): array
    {
        $totalEmployees = Department::sum('employees_count');
        $rhActive = RhManager::where('status', true)->count();
        $rhInactive = RhManager::where('status', false)->count();
        $activeContracts = Contract::where('status', 'active')->count();
        $expiredContracts = Contract::where('status', 'expired')->count();
        $totalRecruitments = Recruitment::count();
        $publishedRecruitments = Recruitment::where('status', 'published')->count();
        $totalApplications = Recruitment::sum('applications_count');
        $totalProjects = Project::count();
        $activeProjects = Project::where('status', 'in_progress')->count();

        $totalIncome = (float) ProjectIncome::sum('amount');
        $totalExpense = (float) ProjectExpense::sum('amount');
        $netProfit = $totalIncome - $totalExpense;

        return [
            'total_employees' => $totalEmployees,
            'total_rh_managers' => RhManager::count(),
            'total_departments' => Department::count(),
            'active_contracts' => $activeContracts,
            'total_contracts' => Contract::count(),
            'job_offers' => $totalRecruitments,
            'published_offers' => $publishedRecruitments,
            'total_rh_active' => $rhActive,
            'total_rh_inactive' => $rhInactive,
            'contracts_expired' => $expiredContracts,
            'recruitment_progress' => $totalRecruitments > 0 ? round(($publishedRecruitments / $totalRecruitments) * 100, 1) : 0,
            'growth_rate' => $this->computeGrowthRate($period),
            'total_applications' => $totalApplications,
            'total_projects' => $totalProjects,
            'active_projects' => $activeProjects,
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'net_profit' => $netProfit,
        ];
    }

    public function getRevenueVsExpenses(string $period = '12m'): array
    {
        $months = $this->getMonths($period);
        $monthCount = count($months);
        $isDaily = in_array($period, ['7d', '30d']);
        $format = $isDaily ? 'Y-m-d' : 'Y-m';

        $incomesByMonth = ProjectIncome::select('date', 'amount')
            ->whereNotNull('date')
            ->get()
            ->groupBy(fn($r) => Carbon::parse($r->date)->format($format));

        $expensesByMonth = ProjectExpense::select('date', 'amount')
            ->whereNotNull('date')
            ->get()
            ->groupBy(fn($r) => Carbon::parse($r->date)->format($format));

        return collect($months)->map(function ($month) use ($incomesByMonth, $expensesByMonth) {
            $key = $month['key'];
            $revenue = (float) $incomesByMonth->get($key, collect())->sum('amount');
            $expenses = (float) $expensesByMonth->get($key, collect())->sum('amount');
            return [
                'month' => $month['label'],
                'revenue' => $revenue,
                'expenses' => $expenses,
                'profit' => $revenue - $expenses,
            ];
        })->toArray();
    }

    public function getEmployeeGrowth(string $period = '12m'): array
    {
        $months = $this->getMonths($period);
        $monthCount = count($months);
        $totalEmployees = Department::sum('employees_count');

        $rhByMonth = RhManager::select('created_at')->get()
            ->groupBy(fn($r) => Carbon::parse($r->created_at)->format('Y-m'));

        $contractsByMonth = Contract::select('created_at')->get()
            ->groupBy(fn($r) => Carbon::parse($r->created_at)->format('Y-m'));

        $cumulative = 0;
        $firstMonth = $monthCount > 0 ? $months[0]['key'] : Carbon::now()->subMonth()->format('Y-m');

        return collect($months)->map(function ($month) use (&$cumulative, $rhByMonth, $contractsByMonth, $totalEmployees, $firstMonth) {
            $key = $month['key'];
            $newRh = $rhByMonth->get($key, collect())->count();
            $newContracts = $contractsByMonth->get($key, collect())->count();

            if ($key === $firstMonth) {
                $cumulative = $totalEmployees;
            } else {
                $cumulative += $newRh + $newContracts;
            }

            return [
                'month' => $month['label'],
                'employees' => max($cumulative, 0),
            ];
        })->toArray();
    }

    public function getRecruitmentTrend(string $period = '12m'): array
    {
        $months = $this->getMonths($period);
        $recruitmentsByMonth = Recruitment::select('created_at', 'applications_count', 'status')
            ->get()
            ->groupBy(fn($r) => Carbon::parse($r->created_at)->format('Y-m'));

        $publishedByMonth = $recruitmentsByMonth->mapWithKeys(fn($items, $key) => [
            $key => $items->where('status', 'published')->sum('applications_count'),
        ]);

        $totalByMonth = $recruitmentsByMonth->mapWithKeys(fn($items, $key) => [
            $key => $items->sum('applications_count'),
        ]);

        return collect($months)->map(function ($month) use ($totalByMonth, $publishedByMonth) {
            $apps = $totalByMonth->get($month['key'], 0);
            $hired = $publishedByMonth->get($month['key'], 0);
            return [
                'month' => $month['label'],
                'applications' => $apps,
                'hired' => $hired,
                'conversion_rate' => $apps > 0 ? round(($hired / $apps) * 100, 1) : 0,
            ];
        })->toArray();
    }

    public function getDepartmentDistribution(): array
    {
        return Department::select('name', 'employees_count as value')
            ->having('employees_count', '>', 0)
            ->get()
            ->toArray();
    }

    public function getContractsStatus(): array
    {
        return [
            ['status' => 'Active', 'count' => Contract::where('status', 'active')->count()],
            ['status' => 'Expirés', 'count' => Contract::where('status', 'expired')->count()],
            ['status' => 'En attente', 'count' => Contract::where('status', 'pending')->count()],
        ];
    }

    public function getMonthlyGrowth(string $period = '12m'): array
    {
        $months = $this->getMonths($period);
        $monthCount = count($months);

        $totalEmployees = Department::sum('employees_count');
        $activeContracts = Contract::where('status', 'active')->count();
        $baseTotal = $totalEmployees + $activeContracts;

        $contractsByMonth = Contract::select('created_at')->get()
            ->groupBy(fn($r) => Carbon::parse($r->created_at)->format('Y-m'));

        $cumulativeContracts = 0;
        $firstMonth = $monthCount > 0 ? $months[0]['key'] : Carbon::now()->subMonth()->format('Y-m');

        return collect($months)->map(function ($month) use (&$cumulativeContracts, $contractsByMonth, $baseTotal, $activeContracts, $firstMonth) {
            $key = $month['key'];
            $newContracts = $contractsByMonth->get($key, collect())->count();

            if ($key === $firstMonth) {
                $cumulativeContracts = $activeContracts;
            } else {
                $cumulativeContracts += $newContracts;
            }

            $total = $baseTotal + max($cumulativeContracts - $activeContracts, 0);

            return [
                'month' => $month['label'],
                'total' => max($total, 0),
                'growth' => 0,
            ];
        })->toArray();
    }

    public function getFinancialSummary(string $period = '12m'): array
    {
        $totalIncome = (float) ProjectIncome::sum('amount');
        $totalExpense = (float) ProjectExpense::sum('amount');
        $profit = $totalIncome - $totalExpense;

        $now = Carbon::now();
        $currentMonth = ProjectIncome::whereMonth('date', $now->month)
            ->whereYear('date', $now->year)
            ->sum('amount');
        $previousMonth = ProjectIncome::whereMonth('date', $now->subMonth()->month)
            ->whereYear('date', $now->year)
            ->sum('amount');

        $revenueChange = 0;
        if ((float) $previousMonth > 0) {
            $revenueChange = round(((float) $currentMonth - (float) $previousMonth) / (float) $previousMonth * 100, 1);
        }

        $budgetUsed = $totalIncome > 0 ? round(($totalExpense / $totalIncome) * 100, 1) : 0;

        return [
            'revenue' => $totalIncome,
            'expenses' => $totalExpense,
            'profit' => $profit,
            'revenue_change' => $revenueChange,
            'budget_used' => min($budgetUsed, 100),
            'budget_remaining' => max(100 - $budgetUsed, 0),
        ];
    }

    public function getProjectsOverview(): array
    {
        $projects = Project::all();
        $byStatus = $projects->groupBy('status')->map(fn($items) => $items->count())->toArray();

        $totalBudget = (float) $projects->sum('budget');
        $totalIncome = (float) ProjectIncome::sum('amount');
        $totalExpenses = (float) ProjectExpense::sum('amount');

        $recentProjects = Project::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'status' => $p->status,
                'budget' => (float) $p->budget,
                'result' => $p->result,
            ])
            ->toArray();

        return [
            'total' => $projects->count(),
            'by_status' => $byStatus,
            'total_budget' => $totalBudget,
            'total_income' => $totalIncome,
            'total_expenses' => $totalExpenses,
            'recent' => $recentProjects,
        ];
    }

    public function getRecruitmentOverview(): array
    {
        $recruitments = Recruitment::all();
        $byStatus = $recruitments->groupBy('status')->map(fn($items) => $items->count())->toArray();
        $totalApplications = $recruitments->sum('applications_count');
        $totalPositions = $recruitments->sum('positions_count');

        $recentRecruitments = Recruitment::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'status' => $r->status,
                'applications_count' => $r->applications_count,
                'department' => $r->department?->name,
            ])
            ->toArray();

        return [
            'total' => $recruitments->count(),
            'by_status' => $byStatus,
            'total_applications' => $totalApplications,
            'total_positions' => $totalPositions,
            'recent' => $recentRecruitments,
        ];
    }

    public function getMeetingsOverview(): array
    {
        return [
            'total' => DB::table('meetings')->count(),
            'upcoming' => DB::table('meetings')->where('date', '>=', now()->toDateString())->count(),
            'completed' => DB::table('meetings')->where('status', 'completed')->count(),
            'total_participants' => DB::table('meeting_participants')->count(),
        ];
    }

    public function getFullAnalytics(string $period = '12m'): array
    {
        return [
            'kpis' => $this->getKPIs($period),
            'financial' => $this->getFinancialSummary($period),
            'revenue_vs_expenses' => $this->getRevenueVsExpenses($period),
            'employee_growth' => $this->getEmployeeGrowth($period),
            'recruitment_trend' => $this->getRecruitmentTrend($period),
            'department_distribution' => $this->getDepartmentDistribution(),
            'contracts_status' => $this->getContractsStatus(),
            'monthly_growth' => $this->getMonthlyGrowth($period),
            'projects' => $this->getProjectsOverview(),
            'recruitments' => $this->getRecruitmentOverview(),
            'meetings' => $this->getMeetingsOverview(),
        ];
    }

    private function computeGrowthRate(string $period): float
    {
        $dateRange = $this->getDateRange($period);

        $employeesCurrent = Department::sum('employees_count');
        $contractsCurrent = Contract::where('created_at', '>=', $dateRange['from'])->count();
        $rhCurrent = RhManager::where('created_at', '>=', $dateRange['from'])->count();

        $total = $employeesCurrent + $contractsCurrent + $rhCurrent;
        if ($total === 0) return 0;

        $base = $employeesCurrent + RhManager::count() + Contract::count();
        if ($base === 0) return 0;

        return round(($total / $base) * 100, 1);
    }

    private function getMonths(string $period): array
    {
        $count = match ($period) {
            '7d' => 7,
            '30d' => 30,
            '3m' => 3,
            '6m' => 6,
            '12m' => 12,
            default => 12,
        };

        if ($period === '7d') {
            return collect(range(0, 6))->map(function ($i) {
                $date = Carbon::now()->subDays(6 - $i);
                return [
                    'label' => $date->format('d M'),
                    'key' => $date->format('Y-m-d'),
                    'date' => $date->toDateString(),
                ];
            })->toArray();
        }

        if ($period === '30d') {
            return collect(range(0, 29))->map(function ($i) {
                $date = Carbon::now()->subDays(29 - $i);
                return [
                    'label' => $date->format('d M'),
                    'key' => $date->format('Y-m-d'),
                    'date' => $date->toDateString(),
                ];
            })->toArray();
        }

        $frMonths = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        return collect(range(0, $count - 1))->map(function ($i) use ($count, $frMonths) {
            $date = Carbon::now()->subMonths($count - 1 - $i);
            return [
                'label' => $frMonths[$date->month - 1],
                'key' => $date->format('Y-m'),
                'date' => $date->toDateString(),
            ];
        })->toArray();
    }

    private function getDateRange(string $period): array
    {
        return [
            'from' => match ($period) {
                '7d' => Carbon::now()->subDays(7),
                '30d' => Carbon::now()->subDays(30),
                '3m' => Carbon::now()->subMonths(3),
                '6m' => Carbon::now()->subMonths(6),
                default => Carbon::now()->subMonths(12),
            },
            'to' => Carbon::now(),
        ];
    }
}
