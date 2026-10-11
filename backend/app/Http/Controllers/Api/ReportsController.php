<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Services\ReportsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function __construct(
        private ReportsService $reportsService
    ) {}

    public function categories(): JsonResponse
    {
        $categories = $this->reportsService->getReportCategories();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function show(Request $request, string $category): JsonResponse
    {
        $validCategories = ['employees', 'departments', 'contracts', 'recruitment', 'financial'];

        if (!in_array($category, $validCategories)) {
            return response()->json([
                'success' => false,
                'message' => "Catégorie de rapport inconnue: {$category}",
            ], 404);
        }

        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'type' => 'nullable|string|max:50',
        ]);

        $data = $this->reportsService->getReportData($category, $request);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
