<?php

namespace App\AI;

use App\AI\Exceptions\AIException;
use App\AI\Executor\Executor;
use App\AI\Groq\ChatResult;
use App\AI\Groq\GroqClient;
use App\AI\Planner\ExecutionPlan;
use App\AI\KnowledgeBase\Retriever;
use App\AI\Tools\ToolRegistry;
use App\Models\AIExecution;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AIService
{
    private const MAX_TOOL_ITERATIONS = 5;
    private const PLAN_CACHE_PREFIX = 'ai_plan_';
    private const PLAN_CACHE_TTL = 600; // 10 minutes

    public function __construct(
        private GroqClient $llm,
        private ToolRegistry $toolRegistry,
        private Executor $executor,
        private ?Retriever $retriever = null,
    ) {}

    /**
     * Traite un message utilisateur.
     *
     * @param array{role: string, content: string}[] $history
     * @return AIResponse
     *
     * @throws AIException
     */
    public function chat(string $message, User $user, array $history = []): AIResponse
    {
        $this->validateMessage($message);

        $messages = $this->buildMessages($message, $user, $history);
        $tools = $this->toolRegistry->toFunctionDefinitions();
        $allTools = $this->toolRegistry->getAll();

        Log::info('AI Chat Request', [
            'user_id' => $user->id,
            'role' => $user->role,
            'message_length' => strlen($message),
            'tools_count' => count($tools),
        ]);

        // Tool calling loop
        $iteration = 0;
        while ($iteration < self::MAX_TOOL_ITERATIONS) {
            $iteration++;

            $result = $this->llm->chatWithTools($messages, $tools);

            // No tool calls → return text response
            if (!$result->hasToolCalls()) {
                $content = $result->content ?? "Je suis désolé, je n'ai pas pu générer de réponse.";

                $this->logExecution($user, $message, null, null, 'completed', 0);

                return AIResponse::text($content);
            }

            // Check if any tool requires confirmation
            $hasConfirmation = false;
            foreach ($result->toolCalls as $tc) {
                $tool = $allTools[$tc['name']] ?? null;
                if ($tool && $tool->requiresConfirmation()) {
                    $hasConfirmation = true;
                    break;
                }
            }

            // Build execution plan
            $summary = $this->buildPlanSummary($message, $result->toolCalls, $allTools);
            $plan = ExecutionPlan::fromToolCalls($summary, $result->toolCalls, $allTools);

            if ($hasConfirmation) {
                // Store plan in cache and return confirmation request
                Cache::put(self::PLAN_CACHE_PREFIX . $plan->id, [
                    'plan' => $plan,
                    'messages' => $messages,
                    'user_id' => $user->id,
                ], self::PLAN_CACHE_TTL);

                $this->logExecution($user, $message, $plan, null, 'pending_confirmation', 0);

                return AIResponse::plan($plan);
            }

            // No confirmation needed → execute immediately
            $execResult = $this->executor->execute($plan, $user);

            // Add tool results to messages for the AI to generate a response
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

            foreach ($execResult->stepResults as $sr) {
                if (!isset($sr['tool'])) continue;
                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => $result->toolCalls[$sr['step']]['id'] ?? 'call_' . uniqid(),
                    'content' => json_encode($sr['result'] ?? $sr['error'] ?? 'No result'),
                ];
            }

            // Log execution
            $this->logExecution($user, $message, $plan, $execResult, 'completed', $execResult->durationMs);
        }

        return AIResponse::text("J'ai rencontré des difficultés pour traiter votre demande. Pourriez-vous reformuler ?");
    }

    /**
     * Confirme et exécute un plan en attente.
     */
    public function confirmPlan(string $planId, User $user): AIResponse
    {
        $cached = Cache::get(self::PLAN_CACHE_PREFIX . $planId);

        if (!$cached) {
            throw AIException::planNotFound();
        }

        /** @var ExecutionPlan $plan */
        $plan = $cached['plan'];

        Cache::forget(self::PLAN_CACHE_PREFIX . $planId);

        $start = microtime(true);
        $execResult = $this->executor->execute($plan, $user);
        $duration = (microtime(true) - $start) * 1000;

        $this->logExecution($user, "(confirmed plan: {$plan->id})", $plan, $execResult, $execResult->success ? 'completed' : 'failed', $duration);

        // Build a summary message from the results
        $summary = $this->buildExecutionSummary($plan, $execResult);

        return AIResponse::withData($summary, $execResult->toArray());
    }

    /**
     * Annule un plan en attente.
     */
    public function cancelPlan(string $planId, User $user): void
    {
        Cache::forget(self::PLAN_CACHE_PREFIX . $planId);
    }

    /**
     * Enregistre l'exécution dans l'historique.
     */
    private function logExecution(
        User $user,
        string $question,
        ?ExecutionPlan $plan,
        mixed $result,
        string $status,
        float $durationMs,
    ): void {
        try {
            $toolsUsed = $plan
                ? array_map(fn($s) => $s->toolName, $plan->steps)
                : [];

            AIExecution::create([
                'user_id' => $user->id,
                'question' => $question,
                'plan' => $plan?->toArray(),
                'result' => $result?->toArray() ?? null,
                'tools_used' => $toolsUsed,
                'status' => $status,
                'duration_ms' => $durationMs,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to log AI execution', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Génère un résumé du plan pour le frontend.
     */
    private function buildPlanSummary(string $userMessage, array $toolCalls, array $allTools): string
    {
        $toolNames = array_map(fn($tc) => $tc['name'], $toolCalls);
        $count = count($toolNames);

        if ($count === 1) {
            return "Je vais exécuter : {$toolNames[0]}";
        }

        return "Je vais exécuter {$count} actions : " . implode(', ', $toolNames);
    }

    /**
     * Génère un résumé humain des résultats d'exécution.
     */
    private function buildExecutionSummary(ExecutionPlan $plan, mixed $execResult): string
    {
        $lines = [];
        $completed = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($execResult->stepResults as $sr) {
            $status = $sr['status'];
            $tool = $sr['tool'] ?? 'unknown';

            if ($status === 'completed') {
                $lines[] = "✅ {$tool} — Terminé";
                $completed++;
            } elseif ($status === 'failed') {
                $lines[] = "❌ {$tool} — Échoué : " . ($sr['error'] ?? 'Erreur');
                $failed++;
            } else {
                $lines[] = "⏭️ {$tool} — Ignoré";
                $skipped++;
            }
        }

        $summary = "## Résultat de l'exécution\n\n";
        $summary .= implode("\n", $lines) . "\n\n";
        $summary .= "**Résumé** : {$completed} terminé(s)";
        if ($failed > 0) $summary .= ", {$failed} échoué(s)";
        if ($skipped > 0) $summary .= ", {$skipped} ignoré(s)";

        return $summary;
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

    private function buildMessages(string $message, User $user, array $frontendHistory): array
    {
        $systemPrompt = $this->buildSystemPrompt($user, $message);
        $maxContext = config('ai.max_context_messages', 20);

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

        $messages[] = ['role' => 'user', 'content' => $message];
        return $messages;
    }

    private function buildSystemPrompt(User $user, string $message = ''): string
    {
        $basePrompt = config('ai.system_prompt', '');

        // Retrieve relevant Knowledge Base documents
        $kbContext = '';
        if ($this->retriever && !empty($message)) {
            try {
                $result = $this->retriever->retrieve($message, $user);
                if (!empty($result['context'])) {
                    $kbContext = "\n\n## Base de Connaissances de l'entreprise\nVoici les informations pertinentes extraites de la base de connaissances. Utilise-les pour enrichir ta réponse :\n\n{$result['context']}";
                }
            } catch (\Throwable $e) {
                Log::warning('KB retrieval failed', ['error' => $e->getMessage()]);
            }
        }

        $roleContext = match ($user->role) {
            'super_admin' => "\n\n## Contexte utilisateur\nTu assistes un **Super Admin** qui a accès à TOUTES les fonctionnalités de l'application.",
            'rh' => "\n\n## Contexte utilisateur\nTu assistes un **Responsable RH** qui a accès aux fonctionnalités de son département uniquement.",
            'candidate' => "\n\n## Contexte utilisateur\nTu assistes un **Candidat** qui a accès à son espace personnel (profil, CV, candidatures, calendrier).",
            default => '',
        };

        $dateContext = "\n\n## Date/Heure\nNous sommes le " . now()->format('d/m/Y \à H:i') . ".";

        $kbInstruction = $kbContext
            ? "\n\n## Instruction importante\nTu as accès à des informations de la Base de Connaissances de l'entreprise. **Privilégie ces informations** pour tes réponses. Si la base ne contient pas d'information pertinente, précise que la réponse est basée sur tes connaissances générales."
            : '';

        return $basePrompt . $kbContext . $roleContext . $dateContext . $kbInstruction;
    }

    public function getAvailableToolsInfo(): array
    {
        return array_map(fn($tool) => [
            'name' => $tool->getName(),
            'description' => $tool->getDescription(),
            'category' => $tool->getCategory(),
            'requires_confirmation' => $tool->requiresConfirmation(),
        ], $this->toolRegistry->getAll());
    }

    public function getAvailableActionsInfo(): array
    {
        return [];
    }
}
