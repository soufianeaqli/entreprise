<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidateResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'cin' => $this->cin,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'gender' => $this->gender,
            'address' => $this->address,
            'photo' => $this->photo,
            'recruitment_id' => $this->recruitment_id,
            'recruitment' => $this->whenLoaded('recruitment', function () {
                return [
                    'id' => $this->recruitment->id,
                    'title' => $this->recruitment->title,
                    'contract_type' => $this->recruitment->contract_type,
                ];
            }),
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department', function () {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                ];
            }),
            'cover_letter' => $this->cover_letter,
            'cv_file' => $this->cv_file,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'notes' => $this->notes,
            'interview_date' => $this->interview_date?->format('Y-m-d'),
            'interview_time' => $this->interview_time,
            'interview_notes' => $this->interview_notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
