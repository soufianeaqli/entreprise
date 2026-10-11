<?php

namespace App\AI;

use App\AI\Context\ContextBuilder;
use App\AI\Exceptions\AIException;
use App\AI\Groq\GroqClient;
use App\AI\Memory\ConversationMemory;
use App\AI\Tools\ToolRegistry;
use App\Models\AIExecution;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AIOrchestrator
{
    private const MAX_TOOL_ITERATIONS = 5;

    public function __construct(
        private GroqClient $llm,
        private ToolRegistry $toolRegistry,
        private ContextBuilder $contextBuilder,
        private ConversationMemory $memory,
    ) {}

    /**
     * Process a user message — information and guidance only.
     */
    public function chat(string $message, User $user, array $history = []): AIResponse
    {
        $this->validateMessage($message);

        // 1. Build context
        $context = $this->contextBuilder->build($user, $message);
        $contextStr = $this->contextBuilder->formatForPrompt($context);

        // 2. Build system prompt with context
        $systemPrompt = $this->buildSystemPrompt($user, $message, $contextStr);

        // 3. Build messages
        $messages = $this->buildMessages($systemPrompt, $user, $history);

        // 4. Get read-only tools
        $allTools = $this->toolRegistry->getAll();
        $tools = $this->toolRegistry->toFunctionDefinitions();

        Log::info('AI Orchestrator Request', [
            'user_id' => $user->id,
            'role' => $user->role,
            'message_length' => strlen($message),
            'tools_count' => count($tools),
            'context_alerts' => count($context['alerts']),
        ]);

        // 5. Tool calling loop (read-only tools only)
        $iteration = 0;
        while ($iteration < self::MAX_TOOL_ITERATIONS) {
            $iteration++;

            $result = $this->llm->chatWithTools($messages, $tools);

            // No tool calls → return text response
            if (!$result->hasToolCalls()) {
                $content = $result->content ?? "Je suis désolé, je n'ai pas pu générer de réponse.";

                $this->memory->addMessage($user->id, 'user', $message);
                $this->memory->addMessage($user->id, 'assistant', $content);
                $this->logExecution($user, $message, null, null, 'completed', 0);

                return AIResponse::text($content);
            }

            // Execute read-only tools and feed results back
            $messages[] = [
                'role' => 'assistant',
                'content' => null,
                'tool_calls' => array_map(fn($tc) => [
                    'id' => $tc['id'],
                    'type' => 'function',
                    'function' => [
                        'name' => $tc['name'],
                        'arguments' => json_encode($tc['arguments']),
                    ],
                ], $result->toolCalls),
            ];

            foreach ($result->toolCalls as $tc) {
                $tool = $allTools[$tc['name']] ?? null;
                $toolResult = null;

                if ($tool) {
                    try {
                        $toolResult = $tool->execute($tc['arguments'], $user->id, $user->role);
                    } catch (\Throwable $e) {
                        $toolResult = ['error' => $e->getMessage()];
                        Log::warning('Tool execution failed', [
                            'tool' => $tc['name'],
                            'error' => $e->getMessage(),
                        ]);
                    }
                } else {
                    $toolResult = ['error' => "Outil inconnu: {$tc['name']}"];
                }

                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => $tc['id'],
                    'content' => is_string($toolResult) ? $toolResult : json_encode($toolResult),
                ];
            }

            $this->logExecution($user, $message, null, null, 'completed', 0);
        }

        return AIResponse::text("J'ai rencontré des difficultés pour traiter votre demande. Pourriez-vous reformuler ?");
    }

    /**
     * Get available read-only tools info.
     */
    public function getAvailableToolsInfo(): array
    {
        return array_map(fn($tool) => [
            'name' => $tool->getName(),
            'description' => $tool->getDescription(),
            'category' => $tool->getCategory(),
            'requires_confirmation' => false,
        ], $this->toolRegistry->getAll());
    }

    // ─── Private Methods ────────────────────────────────────────────

    private function buildSystemPrompt(User $user, string $message, string $contextStr): string
    {
        $basePrompt = config('ai.system_prompt', '');

        // Memory context
        $memoryContext = $this->memory->getRecentSummary($user->id, 5);

        // Assemble
        $prompt = $basePrompt;
        $prompt .= "\n\n{$contextStr}";
        if ($memoryContext) $prompt .= "\n\n## Conversation récente\n{$memoryContext}";

        return $prompt;
    }

    private function buildMessages(string $systemPrompt, User $user, array $frontendHistory): array
    {
        $maxContext = config('ai.max_context_messages', 5);

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        $trimmedHistory = array_slice($frontendHistory, -$maxContext);
        foreach ($trimmedHistory as $msg) {
            if (!isset($msg['role'], $msg['content'])) continue;
            $role = $msg['role'];
            if (!in_array($role, ['user', 'assistant'])) continue;
            $messages[] = ['role' => $role, 'content' => $msg['content']];
        }

        return $messages;
    }

    private function logExecution(
        User $user,
        string $question,
        mixed $plan,
        mixed $result,
        string $status,
        float $durationMs,
    ): void {
        try {
            AIExecution::create([
                'user_id' => $user->id,
                'question' => $question,
                'plan' => null,
                'result' => null,
                'tools_used' => null,
                'status' => $status,
                'duration_ms' => $durationMs,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to log AI execution', ['error' => $e->getMessage()]);
        }
    }

    private function validateMessage(string $message): void
    {
        $maxLength = config('ai.max_message_length', 4000);
        if (trim($message) === '') {
            throw AIException::messageTooLong($maxLength);
        }
        if (mb_strlen($message) > $maxLength) {
            throw AIException::messageTooLong($maxLength);
        }
    }
}
