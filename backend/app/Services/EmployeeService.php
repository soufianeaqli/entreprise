<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use App\Models\Contract;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeService
{
    public function getAll(?int $departmentId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Employee::with('department');

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        return $query->latest()->get();
    }

    public function getById(int $id): Employee
    {
        return Employee::with(['department', 'user', 'documents.uploader', 'contract'])->findOrFail($id);
    }

    public function create(array $data, ?int $departmentId = null): Employee
    {
        return DB::transaction(function () use ($data, $departmentId) {
            if ($departmentId && empty($data['department_id'])) {
                $data['department_id'] = $departmentId;
            }

            $data['matricule'] = $this->generateMatricule();

            $employee = Employee::create($data);

            $existingUser = User::where('email', $employee->email)->first();
            if ($existingUser) {
                $existingUser->update([
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                ]);
            } else {
                User::create([
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'email' => $employee->email,
                    'password' => 'employee123',
                    'role' => 'employee',
                    'is_active' => true,
                ]);
            }

            $contractData = [
                'employee_name' => $employee->email,
                'type' => $employee->contract_type,
                'department' => $employee->department->name ?? null,
                'start_date' => $employee->hire_date,
                'salary' => $employee->salary,
                'status' => 'active',
                'rh_manager_id' => null,
            ];

            if ($departmentId) {
                $rhManager = \App\Models\Department::find($departmentId)->rhManager;
                if ($rhManager) {
                    $contractData['rh_manager_id'] = $rhManager->id;
                }
            }

            Contract::create($contractData);

            return $employee->load('department');
        });
    }

    public function update(Employee $employee, array $data): Employee
    {
        $employee->update($data);

        if (isset($data['first_name']) || isset($data['last_name'])) {
            $user = User::where('email', $employee->email)->first();
            if ($user) {
                $user->update([
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                ]);
            }
        }

        return $employee->fresh('department');
    }

    public function delete(Employee $employee): void
    {
        DB::transaction(function () use ($employee) {
            $user = User::where('email', $employee->email)->first();
            if ($user) {
                $user->tokens()->delete();
                $user->delete();
            }

            Contract::where('employee_name', $employee->email)->delete();

            $employee->delete();
        });
    }

    public function toggleStatus(Employee $employee): Employee
    {
        $employee->update(['status' => !$employee->status]);

        $user = User::where('email', $employee->email)->first();
        if ($user) {
            $user->update(['is_active' => $employee->status]);
            if (!$employee->status) {
                $user->tokens()->delete();
            }
        }

        return $employee->fresh('department');
    }

    public function resetPassword(Employee $employee): array
    {
        $password = 'employee123';
        $user = User::where('email', $employee->email)->first();
        if ($user) {
            $user->update(['password' => $password]);
            $user->tokens()->delete();
        }

        return ['password' => $password];
    }

    public function getStats(?int $departmentId = null): array
    {
        $query = Employee::query();
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $total = $query->count();
        $active = $query->where('status', true)->count();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active,
            'male' => $query->where('gender', 'male')->count(),
            'female' => $query->where('gender', 'female')->count(),
        ];
    }

    private function generateMatricule(): string
    {
        $lastEmployee = Employee::latest('id')->first();
        $number = $lastEmployee ? intval(substr($lastEmployee->matricule, 4)) + 1 : 1;
        return 'EMP' . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
