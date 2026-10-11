<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Annonce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnonceController extends Controller
{
    public function index(): JsonResponse
    {
        $annonces = Annonce::latest()->get();
        return response()->json($annonces);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'salary' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:published,draft,archived',
            'deadline' => 'nullable|date',
        ]);

        $validated['posted_date'] = now()->toDateString();

        $annonce = Annonce::create($validated);
        return response()->json($annonce, 201);
    }

    public function show(Annonce $annonce): JsonResponse
    {
        return response()->json($annonce);
    }

    public function update(Request $request, Annonce $annonce): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'department' => 'sometimes|string|max:255',
            'location' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'salary' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:published,draft,archived',
            'deadline' => 'nullable|date',
        ]);

        $annonce->update($validated);
        return response()->json($annonce);
    }

    public function destroy(Annonce $annonce): JsonResponse
    {
        $annonce->delete();
        return response()->json(null, 204);
    }

    public function publish(Annonce $annonce): JsonResponse
    {
        $annonce->update(['status' => 'published']);
        return response()->json($annonce);
    }

    public function archive(Annonce $annonce): JsonResponse
    {
        $annonce->update(['status' => 'archived']);
        return response()->json($annonce);
    }
}
