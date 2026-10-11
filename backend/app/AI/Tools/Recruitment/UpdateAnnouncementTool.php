<?php

namespace App\AI\Tools\Recruitment;

use App\AI\Tools\BaseActionTool;
use App\Models\Recruitment;

class UpdateAnnouncementTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'update_recruitment';
    }

    public function getDescription(): string
    {
        return 'Modifie une annonce de recrutement existante.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'recruitment_id' => ['type' => 'integer', 'description' => 'ID de l\'annonce'],
                'title' => ['type' => 'string', 'description' => 'Titre'],
                'location' => ['type' => 'string', 'description' => 'Lieu'],
                'work_mode' => ['type' => 'string', 'enum' => ['on_site', 'remote', 'hybrid']],
                'positions_count' => ['type' => 'integer', 'description' => 'Nombre de postes'],
                'salary' => ['type' => 'number', 'description' => 'Salaire'],
                'deadline' => ['type' => 'string', 'description' => 'Date limite'],
                'description' => ['type' => 'string'],
                'missions' => ['type' => 'string'],
                'skills' => ['type' => 'string'],
            ],
            'required' => ['recruitment_id'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['recruitment_id']);

        $rec = Recruitment::findOrFail($parameters['recruitment_id']);
        $service = app(\App\Services\RecruitmentService::class);

        $data = array_filter([
            'title' => $parameters['title'] ?? null,
            'location' => $parameters['location'] ?? null,
            'work_mode' => $parameters['work_mode'] ?? null,
            'positions_count' => $parameters['positions_count'] ?? null,
            'salary' => $parameters['salary'] ?? null,
            'deadline' => $parameters['deadline'] ?? null,
            'description' => $parameters['description'] ?? null,
            'missions' => $parameters['missions'] ?? null,
            'skills' => $parameters['skills'] ?? null,
        ], fn($v) => $v !== null);

        $rec = $service->update($rec, $data);

        return [
            'success' => true,
            'message' => "Annonce '{$rec->title}' mise à jour.",
            'data' => ['id' => $rec->id, 'title' => $rec->title, 'status' => $rec->status],
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
