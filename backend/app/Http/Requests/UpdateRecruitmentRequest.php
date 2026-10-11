<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRecruitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'department_id' => 'nullable|integer|exists:departments,id',
            'rh_manager_id' => 'nullable|integer|exists:rh_managers,id',
            'contract_type' => 'sometimes|in:CDI,CDD,Stage,Alternance',
            'location' => 'nullable|string|max:255',
            'work_mode' => 'nullable|in:presentiel,hybride,teletravail',
            'positions_count' => 'nullable|integer|min:1',
            'experience_level' => 'nullable|string|max:255',
            'education_level' => 'nullable|string|max:255',
            'salary' => 'nullable|numeric|min:0',
            'posted_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'status' => 'nullable|in:draft,published,closed,archived',
            'description' => 'nullable|string|max:5000',
            'missions' => 'nullable|string|max:5000',
            'skills' => 'nullable|string|max:3000',
            'qualifications' => 'nullable|string|max:3000',
            'benefits' => 'nullable|string|max:3000',
            'additional_info' => 'nullable|string|max:3000',
        ];
    }

    public function messages(): array
    {
        return [
            'title.string' => 'Le titre est invalide.',
            'contract_type.in' => 'Type de contrat invalide.',
            'salary.numeric' => 'Le salaire doit être un nombre.',
            'salary.min' => 'Le salaire ne peut pas être négatif.',
            'positions_count.min' => 'Le nombre de postes doit être au moins 1.',
        ];
    }
}
