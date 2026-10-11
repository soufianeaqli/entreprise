<?php

namespace App\AI\Guide;

use Illuminate\Support\Facades\Cache;

class ConversationState
{
    private const CACHE_PREFIX = 'ai_guide_';
    private const CACHE_TTL = 1800; // 30 minutes

    public function __construct(
        public readonly int $userId,
        public ?string $resourceType = null,
        public array $collected = [],
        public ?string $currentField = null,
        public string $status = 'idle',
        public int $step = 0,
        public array $suggestions = [],
        public ?string $pendingConfirmation = null,
        public array $history = [],
    ) {}

    public static function get(int $userId): self
    {
        $data = Cache::get(self::CACHE_PREFIX . $userId);
        if (!$data) {
            return new self(userId: $userId);
        }

        return new self(
            userId: $userId,
            resourceType: $data['resource_type'] ?? null,
            collected: $data['collected'] ?? [],
            currentField: $data['current_field'] ?? null,
            status: $data['status'] ?? 'idle',
            step: $data['step'] ?? 0,
            suggestions: $data['suggestions'] ?? [],
            pendingConfirmation: $data['pending_confirmation'] ?? null,
            history: $data['history'] ?? [],
        );
    }

    public function save(): void
    {
        Cache::put(self::CACHE_PREFIX . $this->userId, [
            'resource_type' => $this->resourceType,
            'collected' => $this->collected,
            'current_field' => $this->currentField,
            'status' => $this->status,
            'step' => $this->step,
            'suggestions' => $this->suggestions,
            'pending_confirmation' => $this->pendingConfirmation,
            'history' => $this->history,
        ], self::CACHE_TTL);
    }

    public function clear(): void
    {
        Cache::forget(self::CACHE_PREFIX . $this->userId);
        $this->resourceType = null;
        $this->collected = [];
        $this->currentField = null;
        $this->status = 'idle';
        $this->step = 0;
        $this->suggestions = [];
        $this->pendingConfirmation = null;
        $this->history = [];
    }

    public function isActive(): bool
    {
        return $this->status !== 'idle' && $this->resourceType !== null;
    }

    public function startGuide(string $resourceType): void
    {
        $this->resourceType = $resourceType;
        $this->collected = [];
        $this->currentField = null;
        $this->status = 'collecting';
        $this->step = 0;
        $this->suggestions = [];
        $this->pendingConfirmation = null;
        $this->history = [];
        $this->save();
    }

    public function setCollected(string $key, mixed $value): void
    {
        $this->collected[$key] = $value;
        $this->history[] = [
            'action' => 'set',
            'field' => $key,
            'value' => $value,
            'timestamp' => now()->toIso8601String(),
        ];
        $this->step++;
        $this->save();
    }

    public function setSuggestions(array $suggestions): void
    {
        $this->suggestions = $suggestions;
        $this->save();
    }

    public function requestConfirmation(string $summary): void
    {
        $this->status = 'confirming';
        $this->pendingConfirmation = $summary;
        $this->save();
    }

    public function markCompleted(): void
    {
        $this->status = 'completed';
        $this->save();
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'resource_type' => $this->resourceType,
            'collected' => $this->collected,
            'current_field' => $this->currentField,
            'status' => $this->status,
            'step' => $this->step,
            'suggestions' => $this->suggestions,
            'pending_confirmation' => $this->pendingConfirmation,
            'history' => $this->history,
            'is_active' => $this->isActive(),
        ];
    }
}
