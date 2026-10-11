<?php

namespace App\Services;

use App\Models\RhManager;
use App\Models\User;
use App\Models\Contract;
use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RhManagerService
{
    public function getAll()
    {
        return RhManager::with(['department', 'contract'])->latest()->get();
    }

    public function getById(int $id)
    {
        return RhManager::with(['department', 'contract'])->findOrFail($id);
    }

    public function create(array $data): RhManager
    {
        return DB::transaction(function () use ($data) {
            $data['matricule'] = $data['matricule'] ?? $this->generateMatricule();
            $plainPassword = $data['password'];
            $data['password'] = bcrypt($plainPassword);

            $rhManager = RhManager::create($data);

            User::create([
                'name' => $rhManager->full_name,
                'email' => $rhManager->email,
                'password' => bcrypt($plainPassword),
                'role' => 'rh',
                'is_active' => true,
            ]);

            $departmentName = null;
            if (!empty($data['department_id'])) {
                $dept = Department::find($data['department_id']);
                if ($dept) {
                    $departmentName = $dept->name;
                    $dept->update(['rh_manager_id' => $rhManager->id]);
                }
            }

            Contract::create([
                'rh_manager_id' => $rhManager->id,
                'employee_name' => $rhManager->full_name,
                'type' => $data['contract_type'],
                'department' => $departmentName,
                'start_date' => $data['contract_start_date'],
                'end_date' => $data['contract_end_date'] ?? null,
                'salary' => $data['salary'] ?? null,
                'status' => 'active',
                'trial_period' => $data['trial_period'] ?? null,
                'work_hours' => $data['work_hours'] ?? null,
                'leave_days' => $data['leave_days'] ?? null,
                'benefits' => $data['benefits'] ?? null,
                'observations' => $data['observations'] ?? null,
            ]);

            return $rhManager->fresh(['department', 'contract']);
        });
    }

    public function update(RhManager $rhManager, array $data): RhManager
    {
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        } else {
            unset($data['password']);
        }

        unset($data['department_id']);
        unset($data['contract_start_date'], $data['contract_end_date']);
        unset($data['trial_period'], $data['work_hours'], $data['leave_days']);
        unset($data['benefits'], $data['observations']);

        $rhManager->update($data);

        $user = User::where('email', $rhManager->email)->where('role', 'rh')->first();
        if ($user) {
            $user->update([
                'name' => $rhManager->full_name,
                'email' => $rhManager->email,
            ]);
        }

        return $rhManager->fresh(['department', 'contract']);
    }

    public function delete(RhManager $rhManager): void
    {
        $user = User::where('email', $rhManager->email)->where('role', 'rh')->first();
        if ($user) {
            $user->tokens()->delete();
            $user->delete();
        }
        $rhManager->contract()->delete();
        $rhManager->delete();
    }

    public function toggleStatus(RhManager $rhManager): RhManager
    {
        $rhManager->update(['status' => !$rhManager->status]);

        $user = User::where('email', $rhManager->email)->where('role', 'rh')->first();
        if ($user) {
            $user->update(['is_active' => $rhManager->status]);
            if (!$rhManager->status) {
                $user->tokens()->delete();
            }
        }

        return $rhManager->fresh(['department', 'contract']);
    }

    public function getAvailable(): \Illuminate\Support\Collection
    {
        $assignedIds = Department::pluck('rh_manager_id')->filter()->values();
        return RhManager::whereNotIn('id', $assignedIds)->get();
    }

    private function generateMatricule(): string
    {
        $last = RhManager::orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->matricule, 3)) + 1 : 1;
        return 'RH-' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
