<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'client' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'budget' => 'sometimes|numeric|min:0',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'manager' => 'nullable|string|max:255',
            'status' => 'nullable|in:planned,in_progress,completed,on_hold,cancelled',
        ];
    }

    public function messages(): array
    {
        return [
            'name.string' => 'Le nom du projet est invalide.',
            'client.string' => 'Le nom du client est invalide.',
            'budget.numeric' => 'Le budget doit être un nombre.',
            'budget.min' => 'Le budget ne peut pas être négatif.',
            'start_date.date' => 'La date de début doit être une date valide.',
            'end_date.after_or_equal' => 'La date de fin doit être postérieure ou égale à la date de début.',
        ];
    }
}
