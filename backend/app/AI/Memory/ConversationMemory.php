<?php

namespace App\AI\Memory;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ConversationMemory
{
    private const PREFIX = 'ai_memory_';
    private const TTL = 3600; // 1 hour
    private const MAX_MESSAGES = 50;
    private const MAX_FACTS = 20;

    /**
     * Get conversation history for a user.
     */
    public function getHistory(int $userId): array
    {
        return Cache::get(self::PREFIX . "history_{$userId}", []);
    }

    /**
     * Add a message to conversation history.
     */
    public function addMessage(int $userId, string $role, string $content): void
    {
        $history = $this->getHistory($userId);

        $history[] = [
            'role' => $role,
            'content' => $content,
            'timestamp' => now()->toIso8601String(),
        ];

        // Trim to max messages
        if (count($history) > self::MAX_MESSAGES) {
            $history = array_slice($history, -self::MAX_MESSAGES);
        }

        Cache::put(self::PREFIX . "history_{$userId}", $history, self::TTL);
    }

    /**
     * Get extracted facts about the user's conversation context.
     */
    public function getFacts(int $userId): array
    {
        return Cache::get(self::PREFIX . "facts_{$userId}", []);
    }

    /**
     * Store a fact extracted from conversation.
     */
    public function addFact(int $userId, string $key, string $value): void
    {
        $facts = $this->getFacts($userId);
        $facts[$key] = [
            'value' => $value,
            'updated_at' => now()->toIso8601String(),
        ];

        // Trim old facts
        if (count($facts) > self::MAX_FACTS) {
            uasort($facts, fn($a, $b) => strtotime($b['updated_at']) - strtotime($a['updated_at']));
            $facts = array_slice($facts, 0, self::MAX_FACTS, true);
        }

        Cache::put(self::PREFIX . "facts_{$userId}", $facts, self::TTL);
    }

    /**
     * Get recent conversation summary for context injection.
     */
    public function getRecentSummary(int $userId, int $limit = 10): string
    {
        $history = $this->getHistory($userId);
        $recent = array_slice($history, -$limit);

        if (empty($recent)) {
            return '';
        }

        $lines = [];
        foreach ($recent as $msg) {
            $role = $msg['role'] === 'user' ? 'Utilisateur' : 'Assistant';
            $content = mb_substr($msg['content'], 0, 100);
            $lines[] = "{$role}: {$content}";
        }

        return implode("\n", $lines);
    }

    /**
     * Clear all memory for a user.
     */
    public function clear(int $userId): void
    {
        Cache::forget(self::PREFIX . "history_{$userId}");
        Cache::forget(self::PREFIX . "facts_{$userId}");
    }

    /**
     * Detect if the user is continuing a previous workflow.
     */
    public function detectContinuation(int $userId, string $message): ?string
    {
        $facts = $this->getFacts($userId);

        // Check if user had a pending workflow
        if (isset($facts['pending_workflow'])) {
            return $facts['pending_workflow']['value'];
        }

        return null;
    }
}
