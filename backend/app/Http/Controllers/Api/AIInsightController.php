<?php

namespace App\Http\Controllers\Api;

use App\AI\Insights\HealthScoreCalculator;
use App\AI\Insights\InsightEngine;
use App\Http\Controllers\Controller;
use App\Models\AIInsight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIInsightController extends Controller
{
    public function __construct(
        private InsightEngine $engine,
        private HealthScoreCalculator $healthScore,
    ) {}

    /**
     * Liste des insights avec filtres.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'nullable|string|in:contract,recruitment,employee,rh,meeting,budget',
            'severity' => 'nullable|string|in:critical,warning,info,success',
            'status' => 'nullable|string|in:new,acknowledged,dismissed',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $insights = $this->engine->getRecent(
            limit: $validated['per_page'] ?? 50,
            category: $validated['category'] ?? null,
            severity: $validated['severity'] ?? null,
            status: $validated['status'] ?? null,
        );

        return response()->json($insights);
    }

    /**
     * Détails d'un insight.
     */
    public function show(AIInsight $insight): JsonResponse
    {
        return response()->json($insight);
    }

    /**
     * Marquer un insight comme traité.
     */
    public function acknowledge(AIInsight $insight): JsonResponse
    {
        $insight->acknowledge();

        return response()->json([
            'message' => 'Insight marqué comme traité.',
            'insight' => $insight,
        ]);
    }

    /**
     * Ignorer un insight.
     */
    public function dismiss(AIInsight $insight): JsonResponse
    {
        $insight->dismiss();

        return response()->json([
            'message' => 'Insight ignoré.',
            'insight' => $insight,
        ]);
    }

    /**
     * Lancer l'analyse manuellement.
     */
    public function analyze(): JsonResponse
    {
        $result = $this->engine->run();

        return response()->json([
            'message' => count($result['insights']) . ' insight(s) trouvé(s), ' . $result['saved'] . ' sauvegardé(s).',
            'insights_found' => count($result['insights']),
            'saved' => $result['saved'],
            'insights' => array_map(fn($i) => $i->toArray(), $result['insights']),
        ]);
    }

    /**
     * Score de santé de l'entreprise.
     */
    public function healthScore(): JsonResponse
    {
        $score = $this->healthScore->calculate();

        return response()->json($score);
    }

    /**
     * Statistiques globales des insights.
     */
    public function stats(): JsonResponse
    {
        $total = AIInsight::count();
        $new = AIInsight::where('status', 'new')->count();
        $acknowledged = AIInsight::where('status', 'acknowledged')->count();
        $dismissed = AIInsight::where('status', 'dismissed')->count();

        $bySeverity = AIInsight::selectRaw('severity, count(*) as count')
            ->groupBy('severity')
            ->pluck('count', 'severity');

        $byCategory = AIInsight::selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        return response()->json([
            'total' => $total,
            'new' => $new,
            'acknowledged' => $acknowledged,
            'dismissed' => $dismissed,
            'by_severity' => $bySeverity,
            'by_category' => $byCategory,
        ]);
    }
}
