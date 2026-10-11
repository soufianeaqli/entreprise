<?php

namespace App\AI\Tools\Meeting;

use App\AI\Tools\BaseActionTool;

class CreateMeetingTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'create_meeting';
    }

    public function getDescription(): string
    {
        return 'Planifie une nouvelle réunion.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'title' => ['type' => 'string', 'description' => 'Titre de la réunion'],
                'date' => ['type' => 'string', 'description' => 'Date (YYYY-MM-DD)'],
                'start_time' => ['type' => 'string', 'description' => 'Heure début (HH:MM)'],
                'end_time' => ['type' => 'string', 'description' => 'Heure fin (HH:MM)'],
                'type' => ['type' => 'string', 'enum' => ['regular', 'weekly', 'monthly', 'special', 'training', 'evaluation'], 'description' => 'Type'],
                'location' => ['type' => 'string', 'description' => 'Lieu'],
                'meeting_link' => ['type' => 'string', 'description' => 'Lien visio'],
                'priority' => ['type' => 'string', 'enum' => ['low', 'medium', 'high', 'urgent'], 'description' => 'Priorité'],
                'description' => ['type' => 'string', 'description' => 'Description'],
                'department_id' => ['type' => 'integer', 'description' => 'ID du département'],
            ],
            'required' => ['title', 'date', 'start_time', 'end_time'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['title', 'date', 'start_time', 'end_time']);

        $service = app(\App\Services\MeetingService::class);

        $data = [
            'title' => $parameters['title'],
            'date' => $parameters['date'],
            'start_time' => $parameters['start_time'],
            'end_time' => $parameters['end_time'],
            'type' => $parameters['type'] ?? 'regular',
            'location' => $parameters['location'] ?? '',
            'meeting_link' => $parameters['meeting_link'] ?? null,
            'priority' => $parameters['priority'] ?? 'medium',
            'description' => $parameters['description'] ?? '',
            'department_id' => $parameters['department_id'] ?? null,
            'participants' => [],
        ];

        $meeting = $service->create($data);

        return [
            'success' => true,
            'message' => "Réunion '{$meeting->title}' planifiée le {$meeting->date} à {$meeting->start_time}.",
            'data' => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'date' => $meeting->date,
                'start_time' => $meeting->start_time,
                'end_time' => $meeting->end_time,
                'location' => $meeting->location,
                'status' => $meeting->status,
            ],
        ];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'meetings';
    }
}
