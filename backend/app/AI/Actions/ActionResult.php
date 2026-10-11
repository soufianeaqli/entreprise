<?php

namespace App\AI\Actions;

class ActionResult
{
    private function __construct(
        public readonly bool $success,
        public readonly string $message,
        public readonly ?array $data = null,
    ) {}

    public static function success(string $message, ?array $data = null): self
    {
        return new self(true, $message, $data);
    }

    public static function error(string $message): self
    {
        return new self(false, $message);
    }

    public static function requiresConfirmation(string $message, array $pendingData = []): self
    {
        return new self(true, $message, ['requires_confirmation' => true, 'pending_data' => $pendingData]);
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'data' => $this->data,
        ];
    }
}
