<?php

namespace App\AI\Tools\Meeting;

use App\AI\Tools\BaseActionTool;
use App\Models\Meeting;

class UpdateMeetingTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'update_meeting';
    }

    public function getDescription(): string
    {
        return 'Modifie une réunion existante.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'meeting_id' => ['type' => 'integer', 'description' => 'ID de la réunion'],
                'title' => ['type' => 'string'],
                'date' => ['type' => 'string', 'description' => 'YYYY-MM-DD'],
                'start_time' => ['type' => 'string', 'description' => 'HH:MM'],
                'end_time' => ['type' => 'string', 'description' => 'HH:MM'],
                'location' => ['type' => 'string'],
                'priority' => ['type' => 'string', 'enum' => ['low', 'medium', 'high', 'urgent']],
                'description' => ['type' => 'string'],
            ],
            'required' => ['meeting_id'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['meeting_id']);

        $meeting = Meeting::findOrFail($parameters['meeting_id']);
        $service = app(\App\Services\MeetingService::class);

        $data = array_filter([
            'title' => $parameters['title'] ?? null,
            'date' => $parameters['date'] ?? null,
            'start_time' => $parameters['start_time'] ?? null,
            'end_time' => $parameters['end_time'] ?? null,
            'location' => $parameters['location'] ?? null,
            'priority' => $parameters['priority'] ?? null,
            'description' => $parameters['description'] ?? null,
        ], fn($v) => $v !== null);

        $meeting = $service->update($meeting, $data);

        return [
            'success' => true,
            'message' => "Réunion '{$meeting->title}' mise à jour.",
            'data' => ['id' => $meeting->id, 'title' => $meeting->title, 'date' => $meeting->date],
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
