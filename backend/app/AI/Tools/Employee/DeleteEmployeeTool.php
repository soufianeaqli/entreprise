<?php

namespace App\AI\Tools\Employee;

use App\AI\Tools\BaseActionTool;
use App\Models\Employee;

class DeleteEmployeeTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'delete_employee';
    }

    public function getDescription(): string
    {
        return 'Supprime un employé et son compte utilisateur.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'employee_id' => ['type' => 'integer', 'description' => 'ID de l\'employé à supprimer'],
            ],
            'required' => ['employee_id'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['employee_id']);

        $employee = Employee::findOrFail($parameters['employee_id']);

        if ($role === 'rh') {
            $deptId = $this->getRhDepartmentId($userId);
            if ($deptId && $employee->department_id !== $deptId) {
                throw new \App\AI\Exceptions\AIException("Cet employé n'est pas dans votre département.", 403);
            }
        }

        $name = $employee->full_name;
        $service = app(\App\Services\EmployeeService::class);
        $service->delete($employee);

        return [
            'success' => true,
            'message' => "Employé {$name} supprimé.",
        ];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'employees';
    }
}
