<?php

namespace App\AI\Groq;

use App\AI\Exceptions\AIException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqClient
{
    private string $apiKey;
    private string $model;
    private string $fallbackModel;
    private int $maxTokens;
    private float $temperature;
    private int $timeout;
    private string $baseUrl;

    public function __construct()
    {
        $provider = config('ai.provider', 'groq');
        $cfg = config("ai.{$provider}", []);

        $this->apiKey = $cfg['api_key'] ?? '';
        $this->model = $cfg['model'] ?? 'gemini-2.0-flash';
        $this->fallbackModel = $cfg['fallback_model'] ?? '';
        $this->maxTokens = (int) ($cfg['max_tokens'] ?? 1024);
        $this->temperature = (float) ($cfg['temperature'] ?? 0.7);
        $this->timeout = (int) ($cfg['timeout'] ?? 60);
        $this->baseUrl = $cfg['base_url'] ?? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

        Log::info('AI Provider initialized', [
            'provider' => $provider,
            'model' => $this->model,
            'base_url' => $this->baseUrl,
        ]);
    }

    /**
     * @param array{role: string, content: string}[] $messages
     */
    public function chat(array $messages): string
    {
        $result = $this->chatWithTools($messages, []);

        if ($result->hasToolCalls()) {
            throw AIException::serverError();
        }

        return $result->content ?? '';
    }

    /**
     * OpenAI-compatible: messages and tools pass through as-is.
     *
     * @param array $messages
     * @param array $tools  OpenAI-format tool definitions
     */
    public function chatWithTools(array $messages, array $tools = [], bool $isFallback = false): ChatResult
    {
        $model = $isFallback && !empty($this->fallbackModel) ? $this->fallbackModel : $this->model;

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => $this->maxTokens,
            'temperature' => $this->temperature,
        ];

        if (!empty($tools)) {
            $fixedTools = array_values(array_map(function (array $tool) {
                $params = $tool['function']['parameters'] ?? $tool['parameters'] ?? [];
                if (is_array($params) && empty($params['properties'])) {
                    $params['properties'] = new \stdClass();
                }
                $tool['function']['parameters'] = $params;
                return $tool;
            }, $tools));
            $payload['tools'] = $fixedTools;
            $payload['tool_choice'] = 'auto';
        }

        try {
            Log::info('Groq Request', [
                'model' => $model,
                'messages_count' => count($messages),
                'tools_count' => count($tools),
                'fallback' => $isFallback,
            ]);

            $maxRetries = 5;
            $attempt = 0;
            $response = null;

            while ($attempt < $maxRetries) {
                $attempt++;
                $response = Http::timeout($this->timeout)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->post($this->baseUrl, $payload);

                // 413: Payload too large — trim context and retry once
                if ($response->status() === 413 && $attempt === 1) {
                    Log::warning('Groq 413 payload too large, trimming context');
                    $systemMsg = $messages[0] ?? null;
                    $userMsg = end($messages);
                    if ($systemMsg && $userMsg) {
                        $messages = [$systemMsg, $userMsg];
                        $payload['messages'] = $messages;
                        continue;
                    }
                }

                // 429: Rate limited — retry only for TPM (per-minute) limits, not TPD (daily)
                if ($response->status() === 429 && $attempt < $maxRetries) {
                    $decoded = json_decode($response->body(), true);
                    $msg = $decoded['error']['message'] ?? '';

                    // TPD (tokens per day) limit — try fallback model if available
                    if (str_contains($msg, 'tokens per day') || str_contains($msg, 'TPD')) {
                        Log::warning('Groq daily token limit reached on ' . $model, ['message' => $msg]);
                        if (!$isFallback && !empty($this->fallbackModel)) {
                            Log::info('Falling back to model', ['model' => $this->fallbackModel]);
                            return $this->chatWithTools($messages, $tools, true);
                        }
                        break;
                    }

                    // TPM (tokens per minute) limit — safe to retry after backoff
                    $retryAfter = 2 * $attempt;
                    if (preg_match('/Please try again in ([\d.]+)s/', $msg, $m)) {
                        $retryAfter = min((float) $m[1] + 1.0, 10.0);
                    }
                    Log::info('Groq rate limited (TPM), retrying', ['attempt' => $attempt, 'wait' => round($retryAfter, 1)]);
                    usleep((int) ($retryAfter * 1_000_000));
                    continue;
                }

                // 400: Bad tool call generation — retry once without tools
                if ($response->status() === 400 && !empty($payload['tools'] ?? []) && $attempt <= 2) {
                    $decoded = json_decode($response->body(), true);
                    $msg = $decoded['error']['message'] ?? '';
                    if (str_contains($msg, 'function') || str_contains($msg, 'tool')) {
                        Log::warning('Groq 400 bad tool call, retrying without tools');
                        $payload['tools'] = [];
                        continue;
                    }
                }

                break;
            }

            // Handle 429 after all retries exhausted
            if ($response->status() === 429) {
                $decoded = json_decode($response->body(), true);
                $msg = $decoded['error']['message'] ?? '';
                Log::warning('Groq rate limit exhausted after retries', ['attempts' => $maxRetries, 'message' => $msg]);
                throw AIException::rateLimited();
            }

            if ($response->failed()) {
                $this->handleHttpError($response->status(), $response->body());
            }

            $data = $response->json();

            $choice = $data['choices'][0] ?? null;
            if (!$choice) {
                return ChatResult::text(null, 'stop');
            }

            $message = $choice['message'] ?? [];
            $finishReason = $choice['finish_reason'] ?? 'stop';

            Log::info('Groq Response', [
                'model' => $data['model'] ?? $model,
                'finish_reason' => $finishReason,
                'has_tool_calls' => !empty($message['tool_calls']),
                'usage' => $data['usage'] ?? null,
            ]);

            // Tool calls
            if (!empty($message['tool_calls'])) {
                $toolCalls = [];
                foreach ($message['tool_calls'] as $tc) {
                    $toolCalls[] = [
                        'id' => $tc['id'] ?? 'call_' . bin2hex(random_bytes(8)),
                        'name' => $tc['function']['name'] ?? '',
                        'arguments' => is_string($tc['function']['arguments'] ?? '')
                            ? json_decode($tc['function']['arguments'], true) ?? []
                            : $tc['function']['arguments'] ?? [],
                    ];
                }
                return ChatResult::withToolCalls($toolCalls, 'tool_calls');
            }

            // Fallback: parse XML-style function calls from text
            $content = $message['content'] ?? null;
            if ($content) {
                $parsedTools = $this->parseXmlFunctionCalls($content);
                if (!empty($parsedTools)) {
                    Log::info('Parsed XML function calls from text', ['count' => count($parsedTools)]);
                    return ChatResult::withToolCalls($parsedTools, 'tool_calls');
                }
            }

            return ChatResult::text($content, $finishReason);
        } catch (AIException $e) {
            throw $e;
        } catch (\Throwable $e) {
            $message = $e->getMessage();

            Log::error('Groq Unknown Error', [
                'message' => $message,
                'class' => get_class($e),
            ]);

            if (str_contains($message, 'cURL error') || str_contains($message, 'Connection')) {
                throw AIException::networkError();
            }
            if (str_contains($message, 'timeout') || str_contains($message, 'timed out')) {
                throw AIException::timeout();
            }

            throw AIException::serverError();
        }
    }

    /**
     * @throws AIException
     */
    private function handleHttpError(int $statusCode, string $body): void
    {
        $decoded = json_decode($body, true);
        $errorMessage = $decoded['error']['message'] ?? $body;

        Log::error('Groq HTTP Error', [
            'status' => $statusCode,
            'message' => $errorMessage,
        ]);

        match (true) {
            in_array($statusCode, [401, 403]) => throw AIException::apiKeyInvalid(),
            $statusCode === 503 => throw AIException::networkError('Service temporairement indisponible.'),
            default => throw AIException::serverError($statusCode),
        };
    }

    /**
     * Parse XML-style function calls from text output.
     * Handles formats like:
     *   <function=name>(args)</function>
     *   <function=name>{...}</function>
     *   <|python_tag|>function_name(args)
     */
    private function parseXmlFunctionCalls(string $text): array
    {
        $toolCalls = [];

        // Pattern 1: <function=name>()</function> or <function=name>{}</function>
        if (preg_match_all('/<function=(\w+)>\s*(.*?)\s*<\/function>/s', $text, $matches)) {
            foreach ($matches[1] as $i => $name) {
                $argsStr = trim($matches[2][$i]);
                $args = !empty($argsStr) ? json_decode($argsStr, true) ?? [] : [];
                $toolCalls[] = [
                    'id' => 'call_' . bin2hex(random_bytes(8)),
                    'name' => $name,
                    'arguments' => $args,
                ];
            }
        }

        return $toolCalls;
    }
}
