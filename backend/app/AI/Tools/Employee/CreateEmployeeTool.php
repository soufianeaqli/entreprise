<?php

namespace App\AI\Tools\Employee;

use App\AI\Tools\BaseActionTool;

class CreateEmployeeTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'create_employee';
    }

    public function getDescription(): string
    {
        return 'Crée un nouvel employé avec son compte utilisateur et contrat.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'first_name' => ['type' => 'string', 'description' => 'Prénom'],
                'last_name' => ['type' => 'string', 'description' => 'Nom'],
                'email' => ['type' => 'string', 'description' => 'Email'],
                'phone' => ['type' => 'string', 'description' => 'Téléphone'],
                'gender' => ['type' => 'string', 'enum' => ['M', 'F'], 'description' => 'Genre'],
                'cin' => ['type' => 'string', 'description' => 'CIN'],
                'department_id' => ['type' => 'integer', 'description' => 'ID du département'],
                'position' => ['type' => 'string', 'description' => 'Poste'],
                'hire_date' => ['type' => 'string', 'description' => 'Date embauche (YYYY-MM-DD)'],
                'contract_type' => ['type' => 'string', 'enum' => ['CDI', 'CDD', 'Stage'], 'description' => 'Type contrat'],
                'salary' => ['type' => 'number', 'description' => 'Salaire mensuel'],
                'address' => ['type' => 'string', 'description' => 'Adresse'],
                'birth_date' => ['type' => 'string', 'description' => 'Date naissance (YYYY-MM-DD)'],
            ],
            'required' => ['first_name', 'last_name', 'email', 'phone', 'gender', 'cin', 'department_id', 'position', 'hire_date', 'contract_type', 'salary'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, [
            'first_name', 'last_name', 'email', 'phone', 'gender', 'cin',
            'department_id', 'position', 'hire_date', 'contract_type', 'salary',
        ]);

        $service = app(\App\Services\EmployeeService::class);

        $data = [
            'first_name' => $parameters['first_name'],
            'last_name' => $parameters['last_name'],
            'email' => $parameters['email'],
            'phone' => $parameters['phone'],
            'gender' => $parameters['gender'],
            'cin' => $parameters['cin'],
            'department_id' => $parameters['department_id'],
            'position' => $parameters['position'],
            'hire_date' => $parameters['hire_date'],
            'contract_type' => $parameters['contract_type'],
            'salary' => $parameters['salary'],
            'address' => $parameters['address'] ?? '',
            'birth_date' => $parameters['birth_date'] ?? null,
        ];

        $employee = $service->create($data, $parameters['department_id']);

        return [
            'success' => true,
            'message' => "Employé {$employee->full_name} créé.",
            'data' => [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'matricule' => $employee->matricule,
                'email' => $employee->email,
                'department' => $employee->department?->name,
                'position' => $employee->position,
                'password' => 'employee123',
            ],
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
