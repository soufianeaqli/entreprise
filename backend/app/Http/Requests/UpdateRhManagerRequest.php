<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRhManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rhManagerId = $this->route('rhManager')?->id;

        return [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'gender' => 'sometimes|required|in:male,female',
            'birth_date' => 'nullable|date|before:today',
            'cin' => 'nullable|string|max:20|unique:rh_managers,cin,' . $rhManagerId,
            'phone' => 'nullable|string|max:20',
            'email' => 'sometimes|required|email|max:255|unique:rh_managers,email,' . $rhManagerId,
            'address' => 'nullable|string|max:500',
            'photo' => 'nullable|string|max:500',
            'department_id' => 'nullable|integer|exists:departments,id',
            'hire_date' => 'nullable|date',
            'contract_type' => 'sometimes|required|in:CDI,CDD,Stage',
            'salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|boolean',
            'password' => 'nullable|string|min:6|confirmed',
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
            'password.min' => 'Le mot de passe doit contenir au moins 6 caractères.',
            'password.confirmed' => 'Les mots de passe ne correspondent pas.',
        ];
    }
}
