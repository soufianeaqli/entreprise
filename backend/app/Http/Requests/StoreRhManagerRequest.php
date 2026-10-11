<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRhManagerRequest extends FormRequest
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
            'gender' => 'required|in:male,female',
            'birth_date' => 'nullable|date|before:today',
            'cin' => 'nullable|string|max:20|unique:rh_managers,cin',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|email|max:255|unique:rh_managers,email',
            'address' => 'nullable|string|max:500',
            'photo' => 'nullable|string|max:500',
            'department_id' => 'nullable|integer|exists:departments,id',
            'hire_date' => 'nullable|date',
            'contract_type' => 'required|in:CDI,CDD,Stage',
            'salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|boolean',
            'password' => 'required|string|min:6|confirmed',

            'contract_start_date' => 'required|date',
            'contract_end_date' => 'nullable|date|after_or_equal:contract_start_date',
            'trial_period' => 'nullable|string|max:100',
            'work_hours' => 'nullable|string|max:100',
            'leave_days' => 'nullable|integer|min:0',
            'benefits' => 'nullable|string|max:1000',
            'observations' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Le prénom est obligatoire.',
            'last_name.required' => 'Le nom est obligatoire.',
            'gender.required' => 'Le sexe est obligatoire.',
            'email.required' => "L'email est obligatoire.",
            'email.unique' => 'Ce email est déjà utilisé.',
            'cin.unique' => 'Ce numéro CIN est déjà utilisé.',
            'contract_type.required' => 'Le type de contrat est obligatoire.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
            'password.confirmed' => 'Les mots de passe ne correspondent pas.',
            'contract_start_date.required' => 'La date de début du contrat est obligatoire.',
        ];
    }
}
