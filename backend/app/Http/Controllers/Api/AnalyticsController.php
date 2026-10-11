<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnalyticsResource;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'period' => 'nullable|in:7d,30d,3m,6m,12m',
        ]);

        $period = $request->get('period', '12m');
        $data = $this->analyticsService->getFullAnalytics($period);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function kpis(Request $request): JsonResponse
    {
        $request->validate([
            'period' => 'nullable|in:7d,30d,3m,6m,12m',
        ]);

        $period = $request->get('period', '12m');

        return response()->json([
            'success' => true,
            'data' => $this->analyticsService->getKPIs($period),
        ]);
    }

    public function revenueExpenses(Request $request): JsonResponse
    {
        $request->validate([
            'period' => 'nullable|in:7d,30d,3m,6m,12m',
        ]);

        $period = $request->get('period', '12m');

        return response()->json([
            'success' => true,
            'data' => $this->analyticsService->getRevenueVsExpenses($period),
        ]);
    }

    public function financial(Request $request): JsonResponse
    {
        $request->validate([
            'period' => 'nullable|in:7d,30d,3m,6m,12m',
        ]);

        $period = $request->get('period', '12m');

        return response()->json([
            'success' => true,
            'data' => $this->analyticsService->getFinancialSummary($period),
        ]);
    }
}
