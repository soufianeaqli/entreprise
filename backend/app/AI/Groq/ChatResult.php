<?php

namespace App\AI\Groq;

class ChatResult
{
    private function __construct(
        public readonly ?string $content,
        public readonly array $toolCalls,
        public readonly string $finishReason,
    ) {}

    public static function text(?string $content, string $finishReason = 'stop'): self
    {
        return new self($content, [], $finishReason);
    }

    /**
     * @param array{id: string, name: string, arguments: array}[] $toolCalls
     */
    public static function withToolCalls(array $toolCalls, string $finishReason = 'tool_calls'): self
    {
        return new self(null, $toolCalls, $finishReason);
    }

    public function hasToolCalls(): bool
    {
        return $this->finishReason === 'tool_calls' && $this->toolCalls !== [];
    }

    public function hasContent(): bool
    {
        return $this->content !== null && $this->content !== '';
    }
}
