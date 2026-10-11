<?php

namespace App\AI\Tools\Finance;

use App\AI\Tools\BaseActionTool;
use App\Models\Project;

class DeleteProjectTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'delete_project';
    }

    public function getDescription(): string
    {
        return 'Supprime un projet budgétaire. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'project_id' => ['type' => 'integer', 'description' => 'ID du projet'],
            ],
            'required' => ['project_id'],
        ];
    }

    protected function authorize(int $userId, string $role): void
    {
        $this->requireSuperAdmin($userId, $role);
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['project_id']);

        $project = Project::findOrFail($parameters['project_id']);
        $name = $project->name;

        $service = app(\App\Services\FinanceService::class);
        $service->deleteProject($project);

        return [
            'success' => true,
            'message' => "Projet '{$name}' supprimé.",
        ];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'finance';
    }
}
