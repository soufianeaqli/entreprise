<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RhManagerResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'matricule' => $this->matricule,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'cin' => $this->cin,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'photo' => $this->photo,
            'hire_date' => $this->hire_date?->format('Y-m-d'),
            'contract_type' => $this->contract_type,
            'salary' => $this->salary,
            'status' => $this->status,
            'department' => $this->whenLoaded('department', fn() => [
                'id' => $this->department->id,
                'name' => $this->department->name,
                'code' => $this->department->code,
            ]),
            'contract' => $this->whenLoaded('contract', fn() => [
                'id' => $this->contract->id,
                'employee_name' => $this->contract->employee_name,
                'type' => $this->contract->type,
                'department' => $this->contract->department,
                'start_date' => $this->contract->start_date?->format('Y-m-d'),
                'end_date' => $this->contract->end_date?->format('Y-m-d'),
                'salary' => $this->contract->salary,
                'status' => $this->contract->status,
                'trial_period' => $this->contract->trial_period,
                'work_hours' => $this->contract->work_hours,
                'leave_days' => $this->contract->leave_days,
                'benefits' => $this->contract->benefits,
                'observations' => $this->contract->observations,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
