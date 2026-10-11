<?php

namespace App\Services;

use App\Models\RhManager;
use App\Models\Department;
use App\Models\Recruitment;
use App\Models\Annonce;
use App\Models\Contract;
use App\Models\FinancialData;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ReportsService
{
    public function getReportCategories(): array
    {
        return [
            [
                'id' => 'employees',
                'name' => 'Employees Report',
                'description' => 'Rapport complet sur les effectifs et départements',
                'icon' => 'users',
                'record_count' => Department::sum('employees_count'),
            ],
            [
                'id' => 'departments',
                'name' => 'Departments Report',
                'description' => 'Analyse des départements et budgets',
                'icon' => 'building',
                'record_count' => Department::count(),
            ],
            [
                'id' => 'contracts',
                'name' => 'Contracts Report',
                'description' => 'Suivi des contrats actifs, expirés et en attente',
                'icon' => 'file-text',
                'record_count' => Contract::count(),
            ],
            [
                'id' => 'recruitment',
                'name' => 'Recruitment Report',
                'description' => 'Offres de recrutement et candidatures',
                'icon' => 'briefcase',
                'record_count' => Recruitment::count() + Annonce::count(),
            ],
            [
                'id' => 'financial',
                'name' => 'Financial Report',
                'description' => 'Revenus, dépenses et bénéfices',
                'icon' => 'dollar-sign',
                'record_count' => FinancialData::count(),
            ],
        ];
    }

    public function getReportData(string $category, Request $request): array
    {
        return match ($category) {
            'employees' => $this->getEmployeesReport($request),
            'departments' => $this->getDepartmentsReport($request),
            'contracts' => $this->getContractsReport($request),
            'recruitment' => $this->getRecruitmentReport($request),
            'financial' => $this->getFinancialReport($request),
            default => throw new \InvalidArgumentException("Catégorie de rapport inconnue: {$category}"),
        };
    }

    public function getEmployeesReport(Request $request): array
    {
        $query = Department::with('rhManager');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status === 'active');
        }

        $departments = $query->orderBy('name')->get();

        $totalEmployees = $departments->sum('employees_count');
        $totalDepartments = $departments->count();

        $rows = $departments->map(function ($dept) {
            return [
                'department' => $dept->name,
                'head' => $dept->rhManager?->full_name ?? '—',
                'employees' => $dept->employees_count,
                'budget' => $dept->annual_budget ? number_format($dept->annual_budget, 0, ',', ' ') . ' MAD' : '—',
                'status' => $dept->status ? 'Actif' : 'Inactif',
            ];
        });

        return [
            'title' => 'Employees Report',
            'summary' => [
                'total_employees' => $totalEmployees,
                'total_departments' => $totalDepartments,
                'avg_per_department' => $totalDepartments > 0 ? round($totalEmployees / $totalDepartments, 1) : 0,
            ],
            'columns' => ['department' => 'Département', 'head' => 'Responsable', 'employees' => 'Employés', 'budget' => 'Budget', 'status' => 'Statut'],
            'rows' => $rows,
        ];
    }

    public function getDepartmentsReport(Request $request): array
    {
        $query = Department::with('rhManager');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $departments = $query->orderBy('name')->get();

        return [
            'title' => 'Departments Report',
            'summary' => [
                'total_departments' => $departments->count(),
                'total_employees' => $departments->sum('employees_count'),
            ],
            'columns' => ['name' => 'Nom', 'code' => 'Code', 'head' => 'Responsable', 'employees_count' => 'Employés', 'budget' => 'Budget', 'status' => 'Statut'],
            'rows' => $departments->map(fn($d) => [
                'name' => $d->name,
                'code' => $d->code,
                'head' => $d->rhManager?->full_name ?? '—',
                'employees_count' => $d->employees_count,
                'budget' => $d->annual_budget ? number_format($d->annual_budget, 0, ',', ' ') . ' MAD' : '—',
                'status' => $d->status ? 'Actif' : 'Inactif',
            ]),
        ];
    }

    public function getContractsReport(Request $request): array
    {
        $query = Contract::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('employee_name', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $contracts = $query->orderBy('created_at', 'desc')->get();

        return [
            'title' => 'Contracts Report',
            'summary' => [
                'total' => $contracts->count(),
                'active' => $contracts->where('status', 'active')->count(),
                'expired' => $contracts->where('status', 'expired')->count(),
                'pending' => $contracts->where('status', 'pending')->count(),
            ],
            'columns' => ['employee_name' => 'Employé', 'type' => 'Type', 'department' => 'Département', 'start_date' => 'Début', 'end_date' => 'Fin', 'salary' => 'Salaire', 'status' => 'Statut'],
            'rows' => $contracts->map(fn($c) => [
                'employee_name' => $c->employee_name,
                'type' => $c->type,
                'department' => $c->department,
                'start_date' => $c->start_date?->format('Y-m-d'),
                'end_date' => $c->end_date?->format('Y-m-d') ?? '—',
                'salary' => $c->salary,
                'status' => $c->status === 'active' ? 'Actif' : ($c->status === 'expired' ? 'Expiré' : 'En attente'),
            ]),
        ];
    }

    public function getRecruitmentReport(Request $request): array
    {
        $query = Recruitment::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $recruitments = $query->orderBy('created_at', 'desc')->get();

        return [
            'title' => 'Recruitment Report',
            'summary' => [
                'total' => $recruitments->count(),
                'published' => $recruitments->where('status', 'published')->count(),
                'draft' => $recruitments->where('status', 'draft')->count(),
                'archived' => $recruitments->where('status', 'archived')->count(),
                'total_applications' => $recruitments->sum('applications'),
            ],
            'columns' => ['title' => 'Titre', 'department' => 'Département', 'type' => 'Type', 'applications' => 'Candidatures', 'salary' => 'Salaire', 'deadline' => 'Date limite', 'status' => 'Statut'],
            'rows' => $recruitments->map(fn($r) => [
                'title' => $r->title,
                'department' => $r->department,
                'type' => $r->type,
                'applications' => $r->applications,
                'salary' => $r->salary,
                'deadline' => $r->deadline?->format('Y-m-d'),
                'status' => ucfirst($r->status),
            ]),
        ];
    }

    public function getFinancialReport(Request $request): array
    {
        $rows = FinancialData::select('month', 'revenue', 'expenses')
            ->get()
            ->map(fn($row) => [
                'month' => $row->month,
                'revenue' => $row->revenue,
                'expenses' => $row->expenses,
                'profit' => $row->revenue - $row->expenses,
            ]);

        $totalRevenue = $rows->sum('revenue');
        $totalExpenses = $rows->sum('expenses');
        $count = max($rows->count(), 1);

        return [
            'title' => 'Financial Report',
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'total_profit' => $totalRevenue - $totalExpenses,
                'avg_monthly_revenue' => round($totalRevenue / $count),
                'avg_monthly_expenses' => round($totalExpenses / $count),
            ],
            'columns' => ['month' => 'Mois', 'revenue' => 'Revenus', 'expenses' => 'Dépenses', 'profit' => 'Bénéfices'],
            'rows' => $rows,
        ];
    }
}
