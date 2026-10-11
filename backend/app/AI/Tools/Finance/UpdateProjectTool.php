<?php

namespace App\AI\Tools\Finance;

use App\AI\Tools\BaseActionTool;
use App\Models\Project;

class UpdateProjectTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'update_project';
    }

    public function getDescription(): string
    {
        return 'Modifie un projet existant. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'project_id' => ['type' => 'integer', 'description' => 'ID du projet'],
                'name' => ['type' => 'string'],
                'client' => ['type' => 'string'],
                'description' => ['type' => 'string'],
                'budget' => ['type' => 'number'],
                'start_date' => ['type' => 'string'],
                'end_date' => ['type' => 'string'],
                'manager' => ['type' => 'string'],
                'status' => ['type' => 'string', 'enum' => ['planned', 'in_progress', 'completed', 'on_hold', 'cancelled']],
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
        $service = app(\App\Services\FinanceService::class);

        $data = array_filter([
            'name' => $parameters['name'] ?? null,
            'client' => $parameters['client'] ?? null,
            'description' => $parameters['description'] ?? null,
            'budget' => $parameters['budget'] ?? null,
            'start_date' => $parameters['start_date'] ?? null,
            'end_date' => $parameters['end_date'] ?? null,
            'manager' => $parameters['manager'] ?? null,
            'status' => $parameters['status'] ?? null,
        ], fn($v) => $v !== null);

        $project = $service->updateProject($project, $data);

        return [
            'success' => true,
            'message' => "Projet '{$project->name}' mis à jour.",
            'data' => ['id' => $project->id, 'name' => $project->name, 'status' => $project->status],
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
