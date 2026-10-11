<?php

namespace App\AI\Tools\Department;

use App\AI\Tools\BaseActionTool;

class CreateDepartmentTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'create_department';
    }

    public function getDescription(): string
    {
        return 'Crée un nouveau département. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'name' => ['type' => 'string', 'description' => 'Nom du département'],
                'code' => ['type' => 'string', 'description' => 'Code unique (ex: IT, RH)'],
                'description' => ['type' => 'string', 'description' => 'Description'],
                'location' => ['type' => 'string', 'description' => 'Localisation'],
                'annual_budget' => ['type' => 'number', 'description' => 'Budget annuel'],
                'rh_manager_id' => ['type' => 'integer', 'description' => 'ID du RH manager assigné (optionnel)'],
            ],
            'required' => ['name', 'code'],
        ];
    }

    protected function authorize(int $userId, string $role): void
    {
        $this->requireSuperAdmin($userId, $role);
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['name', 'code']);

        $service = app(\App\Services\DepartmentService::class);

        $data = array_merge([
            'name' => $parameters['name'],
            'code' => $parameters['code'],
            'description' => $parameters['description'] ?? '',
            'location' => $parameters['location'] ?? '',
            'annual_budget' => $parameters['annual_budget'] ?? 0,
            'rh_manager_id' => $parameters['rh_manager_id'] ?? null,
        ]);

        $dept = $service->create($data);

        return [
            'success' => true,
            'message' => "Département '{$dept->name}' créé avec succès.",
            'data' => ['id' => $dept->id, 'name' => $dept->name, 'code' => $dept->code],
        ];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'departments';
    }
}
