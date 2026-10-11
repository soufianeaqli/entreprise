<?php

namespace App\AI\Tools\Department;

use App\AI\Tools\BaseActionTool;
use App\Models\Department;

class DeleteDepartmentTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'delete_department';
    }

    public function getDescription(): string
    {
        return 'Supprime un département. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'department_id' => ['type' => 'integer', 'description' => 'ID du département à supprimer'],
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
        $name = $dept->name;

        $service = app(\App\Services\DepartmentService::class);
        $service->delete($dept);

        return [
            'success' => true,
            'message' => "Département '{$name}' supprimé.",
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
