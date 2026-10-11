<?php

namespace App\AI\Insights;

use App\AI\Insights\Analyzers\AnalyzerInterface;
use App\Models\AIInsight;
use Illuminate\Support\Facades\Log;

class InsightEngine
{
    /** @var AnalyzerInterface[] */
    private array $analyzers = [];

    public function register(AnalyzerInterface $analyzer): void
    {
        $this->analyzers[$analyzer->getName()] = $analyzer;
    }

    /**
     * Run all analyzers and persist new insights.
     *
     * @return array{insights: Insight[], saved: int}
     */
    public function run(): array
    {
        $allInsights = [];
        $saved = 0;

        foreach ($this->analyzers as $name => $analyzer) {
            try {
                $insights = $analyzer->analyze();
                $allInsights = array_merge($allInsights, $insights);

                foreach ($insights as $insight) {
                    $this->persistInsight($insight);
                    $saved++;
                }

                Log::info('AI Insight analyzer completed', [
                    'analyzer' => $name,
                    'insights_found' => count($insights),
                ]);
            } catch (\Throwable $e) {
                Log::error('AI Insight analyzer failed', [
                    'analyzer' => $name,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return ['insights' => $allInsights, 'saved' => $saved];
    }

    /**
     * Get recent insights (non-dismissed).
     *
     * @return AIInsight[]
     */
    public function getRecent(int $limit = 50, ?string $category = null, ?string $severity = null, ?string $status = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = AIInsight::orderBy('created_at', 'desc');

        if ($category) {
            $query->where('category', $category);
        }
        if ($severity) {
            $query->where('severity', $severity);
        }
        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate(min($limit, 100));
    }

    /**
     * Persist an insight, avoiding exact duplicates within 24h.
     */
    private function persistInsight(Insight $insight): void
    {
        $exists = AIInsight::where('rule', $insight->rule)
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if (!$exists) {
            AIInsight::create([
                'rule' => $insight->rule,
                'title' => $insight->title,
                'description' => $insight->description,
                'severity' => $insight->severity->value,
                'category' => $insight->category->value,
                'actions' => $insight->actions,
                'metadata' => $insight->metadata,
                'status' => 'new',
            ]);
        }
    }
}
