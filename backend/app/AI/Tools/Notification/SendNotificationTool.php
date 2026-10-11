<?php

namespace App\AI\Tools\Notification;

use App\AI\Tools\BaseActionTool;
use App\Models\User;

class SendNotificationTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'send_notification';
    }

    public function getDescription(): string
    {
        return 'Envoie une notification à un ou plusieurs utilisateurs.';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'user_id' => ['type' => 'integer', 'description' => 'ID de l\'utilisateur destinataire'],
                'title' => ['type' => 'string', 'description' => 'Titre de la notification'],
                'message' => ['type' => 'string', 'description' => 'Contenu du message'],
                'type' => ['type' => 'string', 'enum' => ['info', 'success', 'warning', 'error'], 'description' => 'Type'],
                'send_to_all_admins' => ['type' => 'boolean', 'description' => 'Envoyer à tous les admins'],
                'send_to_all_rh' => ['type' => 'boolean', 'description' => 'Envoyer à tous les RH'],
            ],
            'required' => ['title', 'message'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['title', 'message']);

        $service = app(\App\Services\NotificationService::class);

        $type = $parameters['type'] ?? 'info';

        if (!empty($parameters['send_to_all_admins'])) {
            $service->createForAllAdmins($parameters['title'], $parameters['message'], $type, null);
            return ['success' => true, 'message' => 'Notification envoyée à tous les Super Admins.'];
        }

        if (!empty($parameters['send_to_all_rh'])) {
            $service->createForAllRh($parameters['title'], $parameters['message'], $type, null);
            return ['success' => true, 'message' => 'Notification envoyée à tous les RH.'];
        }

        if (!empty($parameters['user_id'])) {
            $user = User::find($parameters['user_id']);
            if (!$user) {
                return ['success' => false, 'message' => 'Utilisateur non trouvé.'];
            }
            $service->createForUser($user->id, $user->role, $parameters['title'], $parameters['message'], $type, null);
            return ['success' => true, 'message' => "Notification envoyée à {$user->name}."];
        }

        return ['success' => false, 'message' => 'Veuillez spécifier un destinataire (user_id, send_to_all_admins, ou send_to_all_rh).'];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'notifications';
    }
}
