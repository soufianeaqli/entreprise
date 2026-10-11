<?php

namespace App\AI;

class AIResponse
{
    public function __construct(
        public readonly string $content,
        public readonly string $type = 'text',
        public readonly ?array $data = null,
        public readonly bool $requiresConfirmation = false,
        public readonly ?string $confirmationMessage = null,
    ) {}

    public static function text(string $content): self
    {
        return new self($content, 'text');
    }

    public function toArray(): array
    {
        return array_filter([
            'content' => $this->content,
            'type' => $this->type,
            'data' => $this->data,
            'requires_confirmation' => $this->requiresConfirmation,
            'confirmation_message' => $this->confirmationMessage,
        ], fn($v) => $v !== null);
    }
}
