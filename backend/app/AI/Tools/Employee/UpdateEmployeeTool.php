<?php

namespace App\AI\Tools\Employee;

use App\AI\Tools\BaseActionTool;
use App\Models\Employee;

class UpdateEmployeeTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'update_employee';
    }

    public function getDescription(): string
    {
        return 'Modifie les informations d\'un employé existant.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'employee_id' => ['type' => 'integer', 'description' => 'ID de l\'employé'],
                'first_name' => ['type' => 'string', 'description' => 'Prénom'],
                'last_name' => ['type' => 'string', 'description' => 'Nom'],
                'email' => ['type' => 'string', 'description' => 'Email'],
                'phone' => ['type' => 'string', 'description' => 'Téléphone'],
                'position' => ['type' => 'string', 'description' => 'Poste'],
                'salary' => ['type' => 'number', 'description' => 'Salaire'],
                'address' => ['type' => 'string', 'description' => 'Adresse'],
            ],
            'required' => ['employee_id'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['employee_id']);

        $employee = Employee::findOrFail($parameters['employee_id']);

        // RH can only update employees in their department
        if ($role === 'rh') {
            $deptId = $this->getRhDepartmentId($userId);
            if ($deptId && $employee->department_id !== $deptId) {
                throw new \App\AI\Exceptions\AIException("Cet employé n'est pas dans votre département.", 403);
            }
        }

        $service = app(\App\Services\EmployeeService::class);

        $data = array_filter([
            'first_name' => $parameters['first_name'] ?? null,
            'last_name' => $parameters['last_name'] ?? null,
            'email' => $parameters['email'] ?? null,
            'phone' => $parameters['phone'] ?? null,
            'position' => $parameters['position'] ?? null,
            'salary' => $parameters['salary'] ?? null,
            'address' => $parameters['address'] ?? null,
        ], fn($v) => $v !== null);

        $employee = $service->update($employee, $data);

        return [
            'success' => true,
            'message' => "Employé {$employee->full_name} mis à jour.",
            'data' => ['id' => $employee->id, 'full_name' => $employee->full_name],
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
