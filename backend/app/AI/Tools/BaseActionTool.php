<?php

namespace App\AI\Tools;

use App\AI\Exceptions\AIException;
use App\Models\User;
use Illuminate\Support\Facades\Log;

abstract class BaseActionTool implements Tool
{
    public function execute(array $parameters, int $userId, string $role): mixed
    {
        $this->authorize($userId, $role);

        $start = microtime(true);

        try {
            $result = $this->doExecute($parameters, $userId, $role);

            $duration = round((microtime(true) - $start) * 1000, 2);

            Log::info('AI Action executed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'success' => true,
                'user_id' => $userId,
                'role' => $role,
            ]);

            return $result;
        } catch (\Throwable $e) {
            $duration = round((microtime(true) - $start) * 1000, 2);

            Log::error('AI Action failed', [
                'tool' => $this->getName(),
                'duration_ms' => $duration,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    abstract protected function doExecute(array $parameters, int $userId, string $role): mixed;

    protected function authorize(int $userId, string $role): void
    {
        // Default: super_admin and rh can do everything
        if (!in_array($role, ['super_admin', 'rh'])) {
            throw AIException::permissionDenied();
        }
    }

    protected function requireSuperAdmin(int $userId, string $role): void
    {
        if ($role !== 'super_admin') {
            throw AIException::permissionDenied('Cette action est réservée aux Super Administrateurs.');
        }
    }

    protected function requireFields(array $parameters, array $required): void
    {
        $missing = [];
        foreach ($required as $field) {
            if (!isset($parameters[$field]) || trim((string) $parameters[$field]) === '') {
                $missing[] = $field;
            }
        }

        if (!empty($missing)) {
            throw AIException::missingParameters($missing);
        }
    }

    protected function getRhDepartmentId(int $userId): ?int
    {
        $user = User::find($userId);
        return $user?->rhManager?->department?->id;
    }

    protected function getUser(int $userId): User
    {
        $user = User::find($userId);
        if (!$user) {
            throw AIException::serverError();
        }
        return $user;
    }
}
