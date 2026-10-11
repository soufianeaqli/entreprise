<?php

namespace App\AI\Tools\Finance;

use App\AI\Tools\BaseActionTool;

class CreateProjectTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'create_project';
    }

    public function getDescription(): string
    {
        return 'Crée un nouveau projet budgétaire. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'name' => ['type' => 'string', 'description' => 'Nom du projet'],
                'client' => ['type' => 'string', 'description' => 'Client'],
                'description' => ['type' => 'string', 'description' => 'Description'],
                'budget' => ['type' => 'number', 'description' => 'Budget alloué'],
                'start_date' => ['type' => 'string', 'description' => 'Date début (YYYY-MM-DD)'],
                'end_date' => ['type' => 'string', 'description' => 'Date fin (YYYY-MM-DD)'],
                'manager' => ['type' => 'string', 'description' => 'Nom du responsable'],
            ],
            'required' => ['name', 'budget'],
        ];
    }

    protected function authorize(int $userId, string $role): void
    {
        $this->requireSuperAdmin($userId, $role);
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['name', 'budget']);

        $service = app(\App\Services\FinanceService::class);

        $data = [
            'name' => $parameters['name'],
            'client' => $parameters['client'] ?? '',
            'description' => $parameters['description'] ?? '',
            'budget' => $parameters['budget'],
            'start_date' => $parameters['start_date'] ?? null,
            'end_date' => $parameters['end_date'] ?? null,
            'manager' => $parameters['manager'] ?? '',
            'status' => 'planned',
        ];

        $project = $service->createProject($data);

        return [
            'success' => true,
            'message' => "Projet '{$project->name}' créé avec un budget de {$project->budget}.",
            'data' => ['id' => $project->id, 'name' => $project->name, 'budget' => $project->budget, 'status' => $project->status],
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
