<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'type' => 'sometimes|required|in:regular,weekly,monthly,special,training,evaluation',
            'department_id' => 'nullable|integer|exists:departments,id',
            'rh_manager_id' => 'nullable|integer|exists:rh_managers,id',
            'date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'sometimes|required|date_format:H:i|after:start_time',
            'location' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|url|max:500',
            'priority' => 'sometimes|required|in:low,medium,high,urgent',
            'status' => 'nullable|in:scheduled,in_progress,completed,cancelled',
            'participants' => 'nullable|array',
            'participants.*' => 'integer|exists:rh_managers,id',
            'minutes_summary' => 'nullable|string',
            'minutes_objective' => 'nullable|string',
            'minutes_key_points' => 'nullable|string',
            'minutes_notes' => 'nullable|string',
        ];
    }
}
