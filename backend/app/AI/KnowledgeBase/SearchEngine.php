<?php

namespace App\AI\KnowledgeBase;

use App\Models\KnowledgeDocument;
use Illuminate\Support\Facades\DB;

class SearchEngine
{
    /**
     * Search knowledge documents by relevance to a query.
     *
     * @return KnowledgeDocument[]
     */
    public function search(string $query, string $role, int $limit = 3): array
    {
        $cleanQuery = $this->cleanQuery($query);
        $keywords = $this->extractKeywords($cleanQuery);

        if (empty($keywords)) {
            return [];
        }

        // Strategy 1: MySQL FULLTEXT search (primary)
        $fullTextResults = $this->fullTextSearch($cleanQuery, $role, $limit * 2);

        // Strategy 2: Keyword LIKE search (supplementary)
        $likeResults = $this->likeSearch($keywords, $role, $limit * 2);

        // Merge and deduplicate
        $merged = collect($fullTextResults)
            ->concat($likeResults)
            ->unique('id')
            ->take($limit)
            ->values()
            ->all();

        return $merged;
    }

    /**
     * Full-text search using MySQL MATCH AGAINST.
     */
    private function fullTextSearch(string $query, string $role, int $limit): array
    {
        try {
            return KnowledgeDocument::where('status', 'active')
                ->where(function ($q) use ($role) {
                    $q->where('access_role', 'all')
                      ->orWhere('access_role', $role);
                })
                ->whereRaw('MATCH(title, content) AGAINST(? IN BOOLEAN MODE)', [$query])
                ->orderByRaw('MATCH(title, content) AGAINST(? IN BOOLEAN MODE) DESC', [$query])
                ->limit($limit)
                ->get()
                ->all();
        } catch (\Throwable $e) {
            // FULLTEXT index may not exist yet, fallback to LIKE
            return [];
        }
    }

    /**
     * LIKE-based search as fallback/supplement.
     */
    private function likeSearch(array $keywords, string $role, int $limit): array
    {
        $query = KnowledgeDocument::where('status', 'active')
            ->where(function ($q) use ($role) {
                $q->where('access_role', 'all')
                  ->orWhere('access_role', $role);
            });

        $query->where(function ($q) use ($keywords) {
            foreach ($keywords as $keyword) {
                $q->orWhere('title', 'LIKE', "%{$keyword}%")
                  ->orWhere('content', 'LIKE', "%{$keyword}%");
            }
        });

        return $query->orderBy('usage_count', 'desc')
            ->limit($limit)
            ->get()
            ->all();
    }

    /**
     * Clean and normalize the search query.
     */
    private function cleanQuery(string $query): string
    {
        // Remove special characters, normalize
        $query = preg_replace('/[^\w\sàâäéèêëïîôùûüÿçœæ]/u', ' ', $query);
        $query = preg_replace('/\s+/', ' ', $query);
        return trim($query);
    }

    /**
     * Extract meaningful keywords (remove stop words).
     */
    private function extractKeywords(string $query): array
    {
        $stopWords = [
            'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'est',
            'sont', 'avec', 'pour', 'par', 'sur', 'dans', 'qui', 'que', 'quel',
            'quelle', 'comment', 'pourquoi', 'combien', 'peux', 'pouvez', 'fais',
            'faire', 'je', 'tu', 'il', 'nous', 'vous', 'ils', 'ce', 'cette',
            'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'do', 'does', 'can', 'could', 'would', 'should',
            'will', 'may', 'might', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that',
            'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
        ];

        $words = explode(' ', strtolower($query));
        $keywords = array_filter($words, function ($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        return array_values($keywords);
    }
}
