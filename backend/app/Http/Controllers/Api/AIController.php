<?php

namespace App\Http\Controllers\Api;

use App\AI\AIOrchestrator;
use App\AI\Exceptions\AIException;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(
        private AIOrchestrator $orchestrator
    ) {}

    /**
     * Envoie un message à l'Assistant IA (mode information uniquement).
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:4000',
            'history' => 'nullable|array',
            'history.*.role' => 'required|in:user,assistant',
            'history.*.content' => 'required|string',
        ]);

        try {
            $response = $this->orchestrator->chat(
                $validated['message'],
                $request->user(),
                $validated['history'] ?? [],
            );

            return response()->json($response->toArray());
        } catch (AIException $e) {
            \Illuminate\Support\Facades\Log::error('AI Controller Error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ], $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('AI Controller Unexpected Error', [
                'message' => $e->getMessage(),
                'class' => get_class($e),
            ]);

            return response()->json([
                'error' => true,
                'message' => 'Une erreur inattendue est survenue.',
                'code' => 500,
            ], 500);
        }
    }

    /**
     * Liste des outils de lecture disponibles.
     */
    public function tools(): JsonResponse
    {
        $tools = $this->orchestrator->getAvailableToolsInfo();
        return response()->json(['tools' => $tools]);
    }
}
