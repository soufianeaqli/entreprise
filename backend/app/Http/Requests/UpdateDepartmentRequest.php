<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $departmentId = $this->route('department')?->id;

        return [
            'name' => 'sometimes|required|string|max:255|unique:departments,name,' . $departmentId,
            'code' => 'sometimes|required|string|max:20|unique:departments,code,' . $departmentId,
            'description' => 'nullable|string|max:1000',
            'rh_manager_id' => 'nullable|integer|exists:rh_managers,id',
            'location' => 'nullable|string|max:255',
            'annual_budget' => 'nullable|numeric|min:0',
            'status' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du département est obligatoire.',
            'name.unique' => 'Ce nom de département existe déjà.',
            'code.required' => 'Le code du département est obligatoire.',
            'code.unique' => 'Ce code de département existe déjà.',
            'rh_manager_id.exists' => 'Le RH sélectionné n\'existe pas.',
        ];
    }
}
