<?php

namespace App\Http\Controllers\Api;

use App\AI\KnowledgeBase\DocumentManager;
use App\AI\KnowledgeBase\SearchEngine;
use App\Http\Controllers\Controller;
use App\Models\KnowledgeBase;
use App\Models\KnowledgeDocument;
use App\Models\KnowledgeUsageLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KnowledgeBaseController extends Controller
{
    public function __construct(
        private DocumentManager $docManager,
        private SearchEngine $searchEngine,
    ) {}

    /**
     * List all knowledge bases.
     */
    public function index(): JsonResponse
    {
        $bases = KnowledgeBase::withCount('documents')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($bases);
    }

    /**
     * Create a new knowledge base.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['slug'] = \Str::slug($validated['name']);

        $kb = KnowledgeBase::create($validated);

        return response()->json($kb, 201);
    }

    /**
     * Show a knowledge base with its documents.
     */
    public function show(KnowledgeBase $knowledgeBase): JsonResponse
    {
        $knowledgeBase->load(['documents' => function ($q) {
            $q->orderBy('created_at', 'desc');
        }]);

        return response()->json($knowledgeBase);
    }

    /**
     * Update a knowledge base.
     */
    public function update(Request $request, KnowledgeBase $knowledgeBase): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $knowledgeBase->update($validated);

        return response()->json($knowledgeBase);
    }

    /**
     * Delete a knowledge base and all its documents.
     */
    public function destroy(KnowledgeBase $knowledgeBase): JsonResponse
    {
        $knowledgeBase->documents()->delete();
        $knowledgeBase->delete();

        return response()->json(['message' => 'Base de connaissances supprimée.']);
    }

    // ── Documents ──────────────────────────────────────────────────────────

    /**
     * List documents in a knowledge base.
     */
    public function documents(Request $request, KnowledgeBase $knowledgeBase): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'nullable|string|in:company,regulations,app_usage,faq,custom',
            'status' => 'nullable|string|in:active,archived',
            'search' => 'nullable|string|max:255',
        ]);

        $query = $knowledgeBase->documents();

        if (!empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }
        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('content', 'LIKE', "%{$search}%");
            });
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($documents);
    }

    /**
     * Store a new document.
     */
    public function storeDocument(Request $request, KnowledgeBase $knowledgeBase): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:company,regulations,app_usage,faq,custom',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
            'access_role' => 'nullable|string|in:all,super_admin,rh,candidate',
            'file' => 'nullable|file|max:10240',
        ]);

        $doc = $this->docManager->createDocument(
            $knowledgeBase,
            $validated,
            $request->file('file'),
        );

        return response()->json($doc, 201);
    }

    /**
     * Show a document.
     */
    public function showDocument(KnowledgeBase $knowledgeBase, KnowledgeDocument $document): JsonResponse
    {
        return response()->json($document);
    }

    /**
     * Update a document.
     */
    public function updateDocument(Request $request, KnowledgeBase $knowledgeBase, KnowledgeDocument $document): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'category' => 'sometimes|in:company,regulations,app_usage,faq,custom',
            'tags' => 'nullable|array',
            'access_role' => 'sometimes|string|in:all,super_admin,rh,candidate',
            'status' => 'sometimes|in:active,archived',
            'file' => 'nullable|file|max:10240',
        ]);

        $doc = $this->docManager->updateDocument(
            $document,
            $validated,
            $request->file('file'),
        );

        return response()->json($doc);
    }

    /**
     * Delete a document.
     */
    public function destroyDocument(KnowledgeBase $knowledgeBase, KnowledgeDocument $document): JsonResponse
    {
        $this->docManager->deleteDocument($document);

        return response()->json(['message' => 'Document supprimé.']);
    }

    // ── Search ─────────────────────────────────────────────────────────────

    /**
     * Search across all knowledge bases.
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|max:255',
            'limit' => 'nullable|integer|min:1|max:20',
        ]);

        $role = $request->user()->role;
        $results = $this->searchEngine->search($validated['query'], $role, $validated['limit'] ?? 10);

        return response()->json([
            'results' => $results,
            'count' => count($results),
        ]);
    }

    // ── Stats ──────────────────────────────────────────────────────────────

    /**
     * Knowledge base usage statistics.
     */
    public function stats(): JsonResponse
    {
        $totalBases = KnowledgeBase::count();
        $totalDocs = KnowledgeDocument::count();
        $activeDocs = KnowledgeDocument::where('status', 'active')->count();
        $totalUsage = KnowledgeUsageLog::count();

        $byCategory = KnowledgeDocument::selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        $mostUsed = KnowledgeDocument::orderBy('usage_count', 'desc')
            ->limit(5)
            ->get(['id', 'title', 'usage_count', 'category']);

        $recentQueries = KnowledgeUsageLog::with('document:id,title')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'total_bases' => $totalBases,
            'total_documents' => $totalDocs,
            'active_documents' => $activeDocs,
            'total_usage' => $totalUsage,
            'by_category' => $byCategory,
            'most_used_documents' => $mostUsed,
            'recent_queries' => $recentQueries,
        ]);
    }
}
