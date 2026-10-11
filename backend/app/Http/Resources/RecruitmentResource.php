<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruitmentResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'department' => $this->whenLoaded('department', fn() => [
                'id' => $this->department->id,
                'name' => $this->department->name,
                'code' => $this->department->code,
            ]),
            'rh_manager' => $this->whenLoaded('rhManager', fn() => [
                'id' => $this->rhManager->id,
                'full_name' => $this->rhManager->full_name,
                'matricule' => $this->rhManager->matricule,
                'email' => $this->rhManager->email,
            ]),
            'department_id' => $this->department_id,
            'rh_manager_id' => $this->rh_manager_id,
            'contract_type' => $this->contract_type,
            'location' => $this->location,
            'work_mode' => $this->work_mode,
            'positions_count' => $this->positions_count,
            'experience_level' => $this->experience_level,
            'education_level' => $this->education_level,
            'salary' => $this->salary ? (float) $this->salary : null,
            'posted_date' => $this->posted_date?->format('Y-m-d'),
            'deadline' => $this->deadline?->format('Y-m-d'),
            'status' => $this->status,
            'description' => $this->description,
            'missions' => $this->missions,
            'skills' => $this->skills,
            'qualifications' => $this->qualifications,
            'benefits' => $this->benefits,
            'additional_info' => $this->additional_info,
            'applications_count' => $this->applications_count,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
