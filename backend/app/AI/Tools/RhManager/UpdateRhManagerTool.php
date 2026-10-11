<?php

namespace App\AI\Tools\RhManager;

use App\AI\Tools\BaseActionTool;
use App\Models\RhManager;

class UpdateRhManagerTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'update_rh_manager';
    }

    public function getDescription(): string
    {
        return 'Modifie les informations d\'un RH existant. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'rh_manager_id' => ['type' => 'integer', 'description' => 'ID du RH'],
                'first_name' => ['type' => 'string', 'description' => 'Prénom'],
                'last_name' => ['type' => 'string', 'description' => 'Nom'],
                'email' => ['type' => 'string', 'description' => 'Email'],
                'phone' => ['type' => 'string', 'description' => 'Téléphone'],
                'address' => ['type' => 'string', 'description' => 'Adresse'],
                'salary' => ['type' => 'number', 'description' => 'Salaire'],
            ],
            'required' => ['rh_manager_id'],
        ];
    }

    protected function authorize(int $userId, string $role): void
    {
        $this->requireSuperAdmin($userId, $role);
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['rh_manager_id']);

        $rh = RhManager::findOrFail($parameters['rh_manager_id']);
        $service = app(\App\Services\RhManagerService::class);

        $data = array_filter([
            'first_name' => $parameters['first_name'] ?? null,
            'last_name' => $parameters['last_name'] ?? null,
            'email' => $parameters['email'] ?? null,
            'phone' => $parameters['phone'] ?? null,
            'address' => $parameters['address'] ?? null,
            'salary' => $parameters['salary'] ?? null,
        ], fn($v) => $v !== null);

        $rh = $service->update($rh, $data);

        return [
            'success' => true,
            'message' => "RH {$rh->full_name} mis à jour.",
            'data' => ['id' => $rh->id, 'full_name' => $rh->full_name, 'email' => $rh->email],
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
