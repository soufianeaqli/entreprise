<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'gender' => 'sometimes|required|in:male,female',
            'birth_date' => 'nullable|date',
            'cin' => 'nullable|string|max:20|unique:employees,cin,' . $this->route('employee')?->id,
            'phone' => 'nullable|string|max:20',
            'email' => 'sometimes|required|email|unique:employees,email,' . $this->route('employee')?->id,
            'address' => 'nullable|string|max:500',
            'photo' => 'nullable|string|max:500',
            'department_id' => 'sometimes|required|exists:departments,id',
            'position' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'contract_type' => 'nullable|string|in:CDI,CDD,Stage,Alternance',
            'salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|boolean',
        ];
    }
}
