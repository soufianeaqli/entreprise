<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCandidateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:candidates,email',
            'phone' => 'nullable|string|max:20',
            'cin' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'gender' => 'required|in:male,female',
            'address' => 'nullable|string|max:500',
            'photo' => 'nullable|string|max:500',
            'recruitment_id' => 'required|exists:recruitments,id',
            'department_id' => 'required|exists:departments,id',
            'cover_letter' => 'nullable|string|max:2000',
            'cv_file' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
