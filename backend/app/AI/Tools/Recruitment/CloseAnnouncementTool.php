<?php

namespace App\AI\Tools\Recruitment;

use App\AI\Tools\BaseActionTool;
use App\Models\Recruitment;

class CloseAnnouncementTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'close_recruitment';
    }

    public function getDescription(): string
    {
        return 'Ferme une annonce de recrutement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'recruitment_id' => ['type' => 'integer', 'description' => 'ID de l\'annonce'],
            ],
            'required' => ['recruitment_id'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['recruitment_id']);

        $rec = Recruitment::findOrFail($parameters['recruitment_id']);
        $service = app(\App\Services\RecruitmentService::class);
        $rec = $service->updateStatus($rec, 'closed');

        return [
            'success' => true,
            'message' => "Annonce '{$rec->title}' fermée.",
            'data' => ['id' => $rec->id, 'title' => $rec->title, 'status' => 'closed'],
        ];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'recruitment';
    }
}
