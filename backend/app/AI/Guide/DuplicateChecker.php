<?php

namespace App\AI\Guide;

use App\Models\Department;
use App\Models\Employee;
use App\Models\RhManager;
use App\Models\User;
use App\Models\Meeting;
use App\Models\Recruitment;
use App\Models\Project;
use Illuminate\Support\Facades\Log;

class DuplicateChecker
{
    public function check(string $resourceType, array $collected): array
    {
        $warnings = [];

        try {
            match ($resourceType) {
                'department' => $this->checkDepartment($collected, $warnings),
                'employee' => $this->checkEmployee($collected, $warnings),
                'rh_manager' => $this->checkRhManager($collected, $warnings),
                'meeting' => $this->checkMeeting($collected, $warnings),
                'recruitment' => $this->checkRecruitment($collected, $warnings),
                'project' => $this->checkProject($collected, $warnings),
                default => null,
            };
        } catch (\Throwable $e) {
            Log::warning('Duplicate check failed', ['type' => $resourceType, 'error' => $e->getMessage()]);
        }

        return $warnings;
    }

    private function checkDepartment(array $data, array &$warnings): void
    {
        if (!empty($data['name'])) {
            $existing = Department::where('name', $data['name'])->first();
            if ($existing) {
                $warnings[] = "Un département nommé « {$data['name']}» existe déjà (ID: {$existing->id}).";
            }
        }
        if (!empty($data['code'])) {
            $existing = Department::where('code', $data['code'])->first();
            if ($existing) {
                $warnings[] = "Le code « {$data['code']}» est déjà utilisé par le département « {$existing->name}».";
            }
        }
    }

    private function checkEmployee(array $data, array &$warnings): void
    {
        if (!empty($data['email'])) {
            $existing = Employee::where('email', $data['email'])->first();
            if ($existing) {
                $warnings[] = "Un employé avec l'email « {$data['email']}» existe déjà ({$existing->first_name} {$existing->last_name}).";
            }
            $user = User::where('email', $data['email'])->first();
            if ($user) {
                $warnings[] = "L'email « {$data['email']}» est déjà utilisé par un compte utilisateur.";
            }
        }
        if (!empty($data['cin'])) {
            $existing = Employee::where('cin', $data['cin'])->first();
            if ($existing) {
                $warnings[] = "Le CIN « {$data['cin']}» est déjà enregistré pour {$existing->first_name} {$existing->last_name}.";
            }
        }
        if (!empty($data['matricule'])) {
            $existing = Employee::where('matricule', $data['matricule'])->first();
            if ($existing) {
                $warnings[] = "Le matricule « {$data['matricule']}» existe déjà.";
            }
        }
    }

    private function checkRhManager(array $data, array &$warnings): void
    {
        if (!empty($data['email'])) {
            $existing = RhManager::where('email', $data['email'])->first();
            if ($existing) {
                $warnings[] = "Un RH Manager avec l'email « {$data['email']}» existe déjà.";
            }
            $user = User::where('email', $data['email'])->first();
            if ($user) {
                $warnings[] = "L'email « {$data['email']}» est déjà utilisé par un compte.";
            }
        }
        if (!empty($data['cin'])) {
            $existing = RhManager::where('cin', $data['cin'])->first();
            if ($existing) {
                $warnings[] = "Le CIN « {$data['cin']}» est déjà enregistré.";
            }
        }
    }

    private function checkMeeting(array $data, array &$warnings): void
    {
        if (!empty($data['title']) && !empty($data['date']) && !empty($data['start_time'])) {
            $existing = Meeting::where('title', $data['title'])
                ->where('date', $data['date'])
                ->where('start_time', $data['start_time'])
                ->first();
            if ($existing) {
                $warnings[] = "Une réunion « {$data['title']}» est déjà prévue à cette date et heure.";
            }
        }
    }

    private function checkRecruitment(array $data, array &$warnings): void
    {
        if (!empty($data['title'])) {
            $existing = Recruitment::where('title', $data['title'])
                ->where('status', '!=', 'closed')
                ->first();
            if ($existing) {
                $warnings[] = "Une annonce « {$data['title']}» est déjà active.";
            }
        }
    }

    private function checkProject(array $data, array &$warnings): void
    {
        if (!empty($data['name'])) {
            $existing = Project::where('name', $data['name'])->first();
            if ($existing) {
                $warnings[] = "Un projet nommé « {$data['name']}» existe déjà.";
            }
        }
    }
}
