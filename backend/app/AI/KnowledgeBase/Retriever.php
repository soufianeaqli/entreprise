<?php

namespace App\AI\KnowledgeBase;

use App\Models\KnowledgeDocument;
use App\Models\KnowledgeUsageLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class Retriever
{
    public function __construct(
        private SearchEngine $searchEngine,
    ) {}

    /**
     * Finds relevant knowledge documents for a user question.
     *
     * @return array{documents: KnowledgeDocument[], context: string}
     */
    public function retrieve(string $question, User $user, int $maxResults = 3): array
    {
        $documents = $this->searchEngine->search($question, $user->role, $maxResults);

        // Log usage
        foreach ($documents as $doc) {
            try {
                $doc->incrementUsage();
                KnowledgeUsageLog::create([
                    'document_id' => $doc->id,
                    'user_id' => $user->id,
                    'question' => $question,
                    'relevance_score' => 1.0,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to log KB usage', ['error' => $e->getMessage()]);
            }
        }

        $context = $this->buildContext($documents);

        return [
            'documents' => $documents,
            'context' => $context,
        ];
    }

    /**
     * Build a context string from retrieved documents.
     */
    private function buildContext(array $documents): string
    {
        if (empty($documents)) {
            return '';
        }

        $parts = [];
        foreach ($documents as $doc) {
            $parts[] = "### {$doc->title}\n{$doc->content}";
        }

        return implode("\n\n---\n\n", $parts);
    }
}
