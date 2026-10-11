<?php

namespace App\AI\Tools\Department;

use App\AI\Tools\BaseActionTool;
use App\Models\Department;

class UpdateDepartmentTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'update_department';
    }

    public function getDescription(): string
    {
        return 'Modifie un département existant. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'department_id' => ['type' => 'integer', 'description' => 'ID du département'],
                'name' => ['type' => 'string', 'description' => 'Nouveau nom'],
                'code' => ['type' => 'string', 'description' => 'Nouveau code'],
                'description' => ['type' => 'string', 'description' => 'Description'],
                'location' => ['type' => 'string', 'description' => 'Localisation'],
                'annual_budget' => ['type' => 'number', 'description' => 'Budget annuel'],
                'rh_manager_id' => ['type' => 'integer', 'description' => 'ID du RH manager'],
            ],
            'required' => ['department_id'],
        ];
    }

    protected function authorize(int $userId, string $role): void
    {
        $this->requireSuperAdmin($userId, $role);
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['department_id']);

        $dept = Department::findOrFail($parameters['department_id']);
        $service = app(\App\Services\DepartmentService::class);

        $data = array_filter([
            'name' => $parameters['name'] ?? null,
            'code' => $parameters['code'] ?? null,
            'description' => $parameters['description'] ?? null,
            'location' => $parameters['location'] ?? null,
            'annual_budget' => $parameters['annual_budget'] ?? null,
            'rh_manager_id' => $parameters['rh_manager_id'] ?? null,
        ], fn($v) => $v !== null);

        $dept = $service->update($dept, $data);

        return [
            'success' => true,
            'message' => "Département '{$dept->name}' mis à jour.",
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
