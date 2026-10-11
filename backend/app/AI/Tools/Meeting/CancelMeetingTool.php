<?php

namespace App\AI\Tools\Meeting;

use App\AI\Tools\BaseActionTool;
use App\Models\Meeting;

class CancelMeetingTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'cancel_meeting';
    }

    public function getDescription(): string
    {
        return 'Annule une réunion planifiée.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'meeting_id' => ['type' => 'integer', 'description' => 'ID de la réunion'],
            ],
            'required' => ['meeting_id'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['meeting_id']);

        $meeting = Meeting::findOrFail($parameters['meeting_id']);
        $service = app(\App\Services\MeetingService::class);
        $meeting = $service->updateStatus($meeting, 'cancelled');

        return [
            'success' => true,
            'message' => "Réunion '{$meeting->title}' annulée.",
            'data' => ['id' => $meeting->id, 'title' => $meeting->title, 'status' => 'cancelled'],
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
