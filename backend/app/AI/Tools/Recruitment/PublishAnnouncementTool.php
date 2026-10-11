<?php

namespace App\AI\Tools\Recruitment;

use App\AI\Tools\BaseActionTool;
use App\Models\Recruitment;

class PublishAnnouncementTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'publish_recruitment';
    }

    public function getDescription(): string
    {
        return 'Publie une annonce de recrutement (passe de draft à published).';
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
        $rec = $service->updateStatus($rec, 'published');

        return [
            'success' => true,
            'message' => "Annonce '{$rec->title}' publiée.",
            'data' => ['id' => $rec->id, 'title' => $rec->title, 'status' => 'published'],
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
