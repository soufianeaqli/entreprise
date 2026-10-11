<?php

namespace App\AI\Tools\RhManager;

use App\AI\Tools\BaseActionTool;

class CreateRhManagerTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'create_rh_manager';
    }

    public function getDescription(): string
    {
        return 'Crée un nouveau responsable RH. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'first_name' => ['type' => 'string', 'description' => 'Prénom'],
                'last_name' => ['type' => 'string', 'description' => 'Nom de famille'],
                'email' => ['type' => 'string', 'description' => 'Email professionnel'],
                'phone' => ['type' => 'string', 'description' => 'Téléphone'],
                'gender' => ['type' => 'string', 'enum' => ['M', 'F'], 'description' => 'Genre'],
                'cin' => ['type' => 'string', 'description' => 'Numéro CIN'],
                'address' => ['type' => 'string', 'description' => 'Adresse'],
                'hire_date' => ['type' => 'string', 'description' => 'Date d\'embauche (YYYY-MM-DD)'],
                'contract_type' => ['type' => 'string', 'enum' => ['CDI', 'CDD', 'Stage'], 'description' => 'Type de contrat'],
                'salary' => ['type' => 'number', 'description' => 'Salaire mensuel'],
                'department_id' => ['type' => 'integer', 'description' => 'ID du département à assigner (optionnel)'],
            ],
            'required' => ['first_name', 'last_name', 'email', 'phone', 'gender', 'cin', 'hire_date', 'contract_type', 'salary'],
        ];
    }

    protected function authorize(int $userId, string $role): void
    {
        $this->requireSuperAdmin($userId, $role);
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, [
            'first_name', 'last_name', 'email', 'phone', 'gender', 'cin', 'hire_date', 'contract_type', 'salary',
        ]);

        $service = app(\App\Services\RhManagerService::class);

        $data = [
            'first_name' => $parameters['first_name'],
            'last_name' => $parameters['last_name'],
            'email' => $parameters['email'],
            'phone' => $parameters['phone'],
            'gender' => $parameters['gender'],
            'cin' => $parameters['cin'],
            'address' => $parameters['address'] ?? '',
            'hire_date' => $parameters['hire_date'],
            'contract_type' => $parameters['contract_type'],
            'salary' => $parameters['salary'],
            'password' => 'rh123456',
        ];

        $rh = $service->create($data);

        return [
            'success' => true,
            'message' => "RH Manager {$rh->full_name} créé avec succès.",
            'data' => [
                'id' => $rh->id,
                'full_name' => $rh->full_name,
                'email' => $rh->email,
                'matricule' => $rh->matricule,
                'password' => 'rh123456',
            ],
        ];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'rh_managers';
    }
}
