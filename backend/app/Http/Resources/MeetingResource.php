<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MeetingResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type,
            'date' => $this->date?->format('Y-m-d'),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'location' => $this->location,
            'meeting_link' => $this->meeting_link,
            'priority' => $this->priority,
            'status' => $this->status,
            'minutes_summary' => $this->minutes_summary,
            'minutes_objective' => $this->minutes_objective,
            'minutes_key_points' => $this->minutes_key_points,
            'minutes_notes' => $this->minutes_notes,
            'department' => $this->whenLoaded('department', fn() => [
                'id' => $this->department->id,
                'name' => $this->department->name,
                'code' => $this->department->code,
            ]),
            'rh_manager' => $this->whenLoaded('rhManager', fn() => [
                'id' => $this->rhManager->id,
                'full_name' => $this->rhManager->full_name,
                'matricule' => $this->rhManager->matricule,
                'email' => $this->rhManager->email,
            ]),
            'participants' => $this->whenLoaded('participants', fn() =>
                $this->participants->map(fn($p) => [
                    'id' => $p->id,
                    'full_name' => $p->full_name,
                    'matricule' => $p->matricule,
                    'email' => $p->email,
                    'pivot_status' => $p->pivot->status,
                ])
            ),
            'decisions' => $this->whenLoaded('decisions', fn() =>
                $this->decisions->map(fn($d) => [
                    'id' => $d->id,
                    'title' => $d->title,
                    'description' => $d->description,
                ])
            ),
            'tasks' => $this->whenLoaded('tasks', fn() =>
                $this->tasks->map(fn($t) => [
                    'id' => $t->id,
                    'title' => $t->title,
                    'description' => $t->description,
                    'due_date' => $t->due_date?->format('Y-m-d'),
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'assignee' => $t->relationLoaded('assignee') && $t->assignee ? [
                        'id' => $t->assignee->id,
                        'full_name' => $t->assignee->full_name,
                        'matricule' => $t->assignee->matricule,
                    ] : null,
                ])
            ),
            'attachments' => $this->whenLoaded('attachments', fn() =>
                $this->attachments->map(fn($a) => [
                    'id' => $a->id,
                    'filename' => $a->filename,
                    'original_name' => $a->original_name,
                    'mime_type' => $a->mime_type,
                    'size' => $a->size,
                ])
            ),
            'participants_count' => $this->whenCounted('participants'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
