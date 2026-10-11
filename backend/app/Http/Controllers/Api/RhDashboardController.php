<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Candidate;
use App\Models\Meeting;
use App\Models\Contract;
use App\Models\Recruitment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RhDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $rhManager = $user->rhManager()->with('department')->first();

        if (!$rhManager || !$rhManager->department) {
            return response()->json(['message' => 'Profil RH non trouvé.'], 404);
        }

        $department = $rhManager->department;
        $departmentId = $department->id;

        $totalEmployees = Employee::where('department_id', $departmentId)->count();
        $activeEmployees = Employee::where('department_id', $departmentId)->where('status', true)->count();
        $activeContracts = Contract::where('status', 'active')
            ->whereIn('employee_name', Employee::where('department_id', $departmentId)->pluck('email'))
            ->count();
        $recruitmentInProgress = Recruitment::where('department_id', $departmentId)
            ->where('status', 'published')
            ->count();
        $todayMeetings = Meeting::where('department_id', $departmentId)
            ->where('date', Carbon::today())
            ->count();
        $pendingCandidates = Candidate::where('department_id', $departmentId)
            ->whereIn('status', ['new', 'reviewing'])
            ->count();

        $recentEmployees = Employee::where('department_id', $departmentId)
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'type' => 'employee',
                    'text' => "Nouvel employé: {$emp->full_name}",
                    'time' => $emp->created_at->diffForHumans(),
                ];
            });

        $recentMeetings = Meeting::where('department_id', $departmentId)
            ->where('date', '>=', Carbon::today())
            ->orderBy('date')
            ->take(2)
            ->get()
            ->map(function ($meeting) {
                return [
                    'id' => $meeting->id,
                    'type' => 'meeting',
                    'text' => "Réunion: {$meeting->title}",
                    'time' => Carbon::parse($meeting->date)->format('d/m/Y'),
                ];
            });

        $recentActivities = $recentEmployees->merge($recentMeetings)->take(5)->values();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'rh_manager' => [
                'id' => $rhManager->id,
                'matricule' => $rhManager->matricule,
                'full_name' => $rhManager->full_name,
                'email' => $rhManager->email,
            ],
            'department' => [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'location' => $department->location,
                'employees_count' => $department->employees_count,
                'annual_budget' => $department->annual_budget,
            ],
            'kpis' => [
                'total_employees' => $totalEmployees,
                'active_employees' => $activeEmployees,
                'active_contracts' => $activeContracts,
                'recruitment_in_progress' => $recruitmentInProgress,
                'meetings_today' => $todayMeetings,
                'pending_tasks' => $pendingCandidates,
            ],
            'recent_activities' => $recentActivities,
        ]);
    }
}
