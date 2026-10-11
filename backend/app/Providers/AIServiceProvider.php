<?php

namespace App\Providers;

use App\AI\AIOrchestrator;
use App\AI\Context\ContextBuilder;
use App\AI\Exceptions\AIException;
use App\AI\FormAssistant\FormSuggestionService;
use App\AI\Groq\GroqClient;
use App\AI\Memory\ConversationMemory;
use App\AI\Tools\ToolRegistry;

// Read-only Tools
use App\AI\Tools\Employee\SearchEmployeesTool;
use App\AI\Tools\Department\GetDepartmentsTool;
use App\AI\Tools\Candidate\GetCandidatesCountTool;
use App\AI\Tools\Contract\GetContractsTool;
use App\AI\Tools\Meeting\GetMeetingsTodayTool;

use Illuminate\Support\ServiceProvider;

class AIServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // ── GroqClient ──
        $this->app->singleton(GroqClient::class, function () {
            $provider = config('ai.provider', 'groq');
            $apiKey = config("ai.{$provider}.api_key", '');
            if (empty($apiKey)) {
                throw AIException::configurationMissing();
            }
            return new GroqClient();
        });

        // ── ToolRegistry (read-only tools only) ──
        $this->app->singleton(ToolRegistry::class, function () {
            $registry = new ToolRegistry();

            // Read-only query tools (minimal set to reduce token usage)
            $registry->register(new SearchEmployeesTool());
            $registry->register(new GetDepartmentsTool());
            $registry->register(new GetCandidatesCountTool());
            $registry->register(new GetContractsTool());
            $registry->register(new GetMeetingsTodayTool());

            return $registry;
        });

        // ── ContextBuilder ──
        $this->app->singleton(ContextBuilder::class, fn() => new ContextBuilder());

        // ── ConversationMemory ──
        $this->app->singleton(ConversationMemory::class, fn() => new ConversationMemory());

        // ── AIOrchestrator (information-only mode) ──
        $this->app->singleton(AIOrchestrator::class, function ($app) {
            return new AIOrchestrator(
                llm: $app->make(GroqClient::class),
                toolRegistry: $app->make(ToolRegistry::class),
                contextBuilder: $app->make(ContextBuilder::class),
                memory: $app->make(ConversationMemory::class),
            );
        });

        // ── Legacy AIService alias ──
        $this->app->alias(AIOrchestrator::class, \App\AI\AIService::class);

        // ── FormSuggestionService ──
        $this->app->singleton(FormSuggestionService::class, function ($app) {
            return new FormSuggestionService(
                groq: $app->make(GroqClient::class),
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
