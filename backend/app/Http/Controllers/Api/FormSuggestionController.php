<?php

namespace App\Http\Controllers\Api;

use App\AI\FormAssistant\FormSuggestionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FormSuggestionController extends Controller
{
    public function __construct(
        private FormSuggestionService $suggestionService,
    ) {}

    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module' => 'required|string|in:department,rh,recruitment,meeting,budget',
            'context' => 'required|array',
        ]);

        $suggestions = $this->suggestionService->generate(
            $validated['module'],
            $validated['context'],
        );

        return response()->json([
            'suggestions' => $suggestions,
        ]);
    }
}
