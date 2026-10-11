<?php

namespace App\AI\Tools\RhManager;

use App\AI\Tools\BaseActionTool;
use App\Models\RhManager;

class DeleteRhManagerTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'delete_rh_manager';
    }

    public function getDescription(): string
    {
        return 'Supprime un RH et son compte utilisateur. Super Admin uniquement.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'rh_manager_id' => ['type' => 'integer', 'description' => 'ID du RH à supprimer'],
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
        $name = $rh->full_name;

        $service = app(\App\Services\RhManagerService::class);
        $service->delete($rh);

        return [
            'success' => true,
            'message' => "RH {$name} supprimé avec succès.",
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
