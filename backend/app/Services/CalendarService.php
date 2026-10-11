<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\Meeting;
use App\Models\Contract;
use App\Models\Employee;
use Carbon\Carbon;

class CalendarService
{
    public function getEvents(int $departmentId, string $departmentName, ?string $from = null, ?string $to = null): array
    {
        $start = $from ? Carbon::parse($from)->startOfDay() : Carbon::now()->startOfMonth()->startOfDay();
        $end = $to ? Carbon::parse($to)->endOfDay() : Carbon::now()->endOfMonth()->endOfDay();

        $events = [];

        $events = array_merge($events, $this->getInterviews($departmentId, $start, $end));
        $events = array_merge($events, $this->getMeetings($departmentId, $start, $end));
        $events = array_merge($events, $this->getContractExpirations($departmentName, $start, $end));
        $events = array_merge($events, $this->getTrialPeriodEndings($departmentId, $start, $end));

        usort($events, fn($a, $b) => $a['date'] <=> $b['date']);

        return $events;
    }

    public function getNotifications(int $departmentId, string $departmentName): array
    {
        $today = Carbon::today();
        $weekLater = Carbon::today()->addDays(7);
        $notifications = [];

        $notifications = array_merge($notifications, $this->getInterviewNotifications($departmentId, $today));
        $notifications = array_merge($notifications, $this->getContractNotifications($departmentName, $today, $weekLater));
        $notifications = array_merge($notifications, $this->getTrialPeriodNotifications($departmentId, $today, $weekLater));
        $notifications = array_merge($notifications, $this->getTodayMeetings($departmentId, $today));

        return $notifications;
    }

    private function getInterviews(int $departmentId, Carbon $start, Carbon $end): array
    {
        $candidates = Candidate::with('recruitment')
            ->where('department_id', $departmentId)
            ->whereNotNull('interview_date')
            ->whereBetween('interview_date', [$start, $end])
            ->get();

        return $candidates->map(function ($c) {
            return [
                'id' => 'interview-' . $c->id,
                'type' => 'interview',
                'date' => $c->interview_date->format('Y-m-d'),
                'time' => $c->interview_time,
                'end_time' => null,
                'title' => $c->full_name,
                'subtitle' => $c->recruitment?->title ?? 'Candidature',
                'status' => $c->status,
                'color' => '#3b82f6',
                'data' => [
                    'candidate_id' => $c->id,
                    'candidate_name' => $c->full_name,
                    'email' => $c->email,
                    'phone' => $c->phone,
                    'cin' => $c->cin,
                    'position' => $c->recruitment?->title,
                    'interview_date' => $c->interview_date->format('Y-m-d'),
                    'interview_time' => $c->interview_time,
                    'interview_notes' => $c->interview_notes,
                    'cover_letter' => $c->cover_letter,
                    'status' => $c->status,
                    'status_label' => $c->status_label,
                ],
            ];
        })->toArray();
    }

    private function getMeetings(int $departmentId, Carbon $start, Carbon $end): array
    {
        $meetings = Meeting::with(['participants'])
            ->where('department_id', $departmentId)
            ->whereBetween('date', [$start, $end])
            ->get();

        return $meetings->map(function ($m) {
            return [
                'id' => 'meeting-' . $m->id,
                'type' => 'meeting',
                'date' => $m->date->format('Y-m-d'),
                'time' => $m->start_time,
                'end_time' => $m->end_time,
                'title' => $m->title,
                'subtitle' => $m->location ?? 'Réunion',
                'status' => $m->status,
                'color' => '#22c55e',
                'data' => [
                    'meeting_id' => $m->id,
                    'title' => $m->title,
                    'description' => $m->description,
                    'type' => $m->type,
                    'location' => $m->location,
                    'start_time' => $m->start_time,
                    'end_time' => $m->end_time,
                    'status' => $m->status,
                    'priority' => $m->priority,
                    'minutes_summary' => $m->minutes_summary,
                    'minutes_objective' => $m->minutes_objective,
                    'minutes_key_points' => $m->minutes_key_points,
                    'minutes_notes' => $m->minutes_notes,
                    'participants_count' => $m->participants_count ?? $m->participants->count(),
                    'participants' => $m->participants->map(fn($p) => [
                        'id' => $p->id,
                        'name' => $p->full_name,
                        'email' => $p->email,
                        'pivot_status' => $p->pivot->status ?? null,
                    ])->toArray(),
                ],
            ];
        })->toArray();
    }

    private function getContractExpirations(string $departmentName, Carbon $start, Carbon $end): array
    {
        $contracts = Contract::where('department', $departmentName)
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [$start, $end])
            ->where('status', 'active')
            ->get();

        return $contracts->map(function ($c) {
            $endDate = Carbon::parse($c->end_date);
            $daysLeft = Carbon::today()->diffInDays($endDate, false);

            return [
                'id' => 'contract-' . $c->id,
                'type' => 'contract',
                'date' => $endDate->format('Y-m-d'),
                'time' => null,
                'end_time' => null,
                'title' => $c->employee_name,
                'subtitle' => 'Fin de contrat',
                'status' => $daysLeft <= 7 ? 'urgent' : ($daysLeft <= 30 ? 'warning' : 'normal'),
                'color' => '#ef4444',
                'data' => [
                    'contract_id' => $c->id,
                    'employee_name' => $c->employee_name,
                    'type' => $c->type,
                    'department' => $c->department,
                    'start_date' => $c->start_date?->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'salary' => $c->salary,
                    'status' => $c->status,
                    'days_remaining' => max(0, (int) $daysLeft),
                    'is_urgent' => $daysLeft <= 7,
                ],
            ];
        })->toArray();
    }

    private function getTrialPeriodEndings(int $departmentId, Carbon $start, Carbon $end): array
    {
        $employees = Employee::where('department_id', $departmentId)
            ->whereNotNull('hire_date')
            ->where('status', true)
            ->get();

        $events = [];
        foreach ($employees as $emp) {
            $hireDate = Carbon::parse($emp->hire_date);
            $trialEnd = $hireDate->copy()->addMonths(3);

            if ($trialEnd->between($start, $end)) {
                $daysLeft = max(0, (int) Carbon::today()->diffInDays($trialEnd, false));
                $events[] = [
                    'id' => 'trial-' . $emp->id,
                    'type' => 'trial',
                    'date' => $trialEnd->format('Y-m-d'),
                    'time' => null,
                    'end_time' => null,
                    'title' => $emp->full_name,
                    'subtitle' => 'Fin période d\'essai',
                    'status' => $daysLeft <= 7 ? 'urgent' : ($daysLeft <= 30 ? 'warning' : 'normal'),
                    'color' => '#eab308',
                    'data' => [
                        'employee_id' => $emp->id,
                        'employee_name' => $emp->full_name,
                        'position' => $emp->position,
                        'hire_date' => $hireDate->format('Y-m-d'),
                        'trial_end_date' => $trialEnd->format('Y-m-d'),
                        'days_remaining' => $daysLeft,
                        'is_urgent' => $daysLeft <= 7,
                        'department' => $emp->department?->name,
                    ],
                ];
            }
        }

        return $events;
    }

    private function getInterviewNotifications(int $departmentId, Carbon $today): array
    {
        $todayInterviews = Candidate::with('recruitment')
            ->where('department_id', $departmentId)
            ->whereNotNull('interview_date')
            ->whereDate('interview_date', $today)
            ->get();

        return $todayInterviews->map(fn($c) => [
            'type' => 'interview_today',
            'message' => "Entretien prévu aujourd'hui avec {$c->full_name} ({$c->recruitment?->title})",
            'time' => $c->interview_time,
            'severity' => 'info',
            'date' => $today->format('Y-m-d'),
        ])->toArray();
    }

    private function getContractNotifications(string $departmentName, Carbon $today, Carbon $weekLater): array
    {
        $expiringContracts = Contract::where('department', $departmentName)
            ->whereNotNull('end_date')
            ->where('status', 'active')
            ->whereBetween('end_date', [$today, $weekLater])
            ->get();

        return $expiringContracts->map(function ($c) use ($today) {
            $daysLeft = $today->diffInDays(Carbon::parse($c->end_date), false);
            return [
                'type' => 'contract_expiring',
                'message' => "Contrat de {$c->employee_name} expire dans {$daysLeft} jour(s)",
                'days_remaining' => max(0, (int) $daysLeft),
                'severity' => $daysLeft <= 3 ? 'danger' : 'warning',
                'date' => Carbon::parse($c->end_date)->format('Y-m-d'),
            ];
        })->toArray();
    }

    private function getTrialPeriodNotifications(int $departmentId, Carbon $today, Carbon $weekLater): array
    {
        $employees = Employee::where('department_id', $departmentId)
            ->whereNotNull('hire_date')
            ->where('status', true)
            ->get();

        $notifications = [];
        foreach ($employees as $emp) {
            $trialEnd = Carbon::parse($emp->hire_date)->addMonths(3);
            if ($trialEnd->between($today, $weekLater)) {
                $daysLeft = max(0, (int) $today->diffInDays($trialEnd, false));
                $notifications[] = [
                    'type' => 'trial_ending',
                    'message' => "Période d'essai de {$emp->full_name} se termine dans {$daysLeft} jour(s)",
                    'days_remaining' => $daysLeft,
                    'severity' => $daysLeft <= 3 ? 'danger' : 'warning',
                    'date' => $trialEnd->format('Y-m-d'),
                ];
            }
        }

        return $notifications;
    }

    private function getTodayMeetings(int $departmentId, Carbon $today): array
    {
        $meetings = Meeting::where('department_id', $departmentId)
            ->whereDate('date', $today)
            ->where('status', 'scheduled')
            ->get();

        return $meetings->map(fn($m) => [
            'type' => 'meeting_today',
            'message' => "Réunion \"{$m->title}\" à {$m->start_time}",
            'time' => $m->start_time,
            'severity' => 'info',
            'date' => $today->format('Y-m-d'),
        ])->toArray();
    }
}
