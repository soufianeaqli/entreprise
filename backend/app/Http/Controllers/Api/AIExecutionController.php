<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AIExecution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIExecutionController extends Controller
{
    /**
     * Liste l'historique des exécutions.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AIExecution::with('user:id,name,email,role');

        // RH sees only their own executions
        if ($request->user()->role === 'rh') {
            $query->where('user_id', $request->user()->id);
        }

        // Candidate sees only their own
        if ($request->user()->role === 'candidate') {
            $query->where('user_id', $request->user()->id);
        }

        $executions = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($executions);
    }

    /**
     * Détails d'une exécution.
     */
    public function show(AIExecution $execution): JsonResponse
    {
        $user = request()->user();

        // Access control
        if ($user->role !== 'super_admin' && $execution->user_id !== $user->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $execution->load('user:id,name,email,role');

        return response()->json($execution);
    }
}
