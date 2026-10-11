<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
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
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                    'code' => $this->department->code,
                ];
            }),
            'position' => $this->position,
            'hire_date' => $this->hire_date?->format('Y-m-d'),
            'contract_type' => $this->contract_type,
            'salary' => $this->salary,
            'status' => $this->status,
            'has_user_account' => $this->relationLoaded('user') ? $this->user !== null : $this->user()->exists(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
