<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'type' => 'required|in:regular,weekly,monthly,special,training,evaluation',
            'department_id' => 'nullable|integer|exists:departments,id',
            'rh_manager_id' => 'nullable|integer|exists:rh_managers,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'nullable|in:scheduled,in_progress,completed,cancelled',
            'participants' => 'nullable|array',
            'participants.*' => 'integer|exists:rh_managers,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Le titre est obligatoire.',
            'type.required' => 'Le type de réunion est obligatoire.',
            'date.required' => 'La date est obligatoire.',
            'date.after_or_equal' => 'La date ne peut pas être dans le passé.',
            'start_time.required' => "L'heure de début est obligatoire.",
            'end_time.required' => "L'heure de fin est obligatoire.",
            'end_time.after' => "L'heure de fin doit être après l'heure de début.",
            'priority.required' => 'La priorité est obligatoire.',
        ];
    }
}
