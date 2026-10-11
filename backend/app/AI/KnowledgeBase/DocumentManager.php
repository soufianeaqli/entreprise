<?php

namespace App\AI\KnowledgeBase;

use App\Models\KnowledgeBase;
use App\Models\KnowledgeDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentManager
{
    /**
     * Create a new document in a knowledge base.
     */
    public function createDocument(KnowledgeBase $kb, array $data, ?UploadedFile $file = null): KnowledgeDocument
    {
        if ($file) {
            $path = $file->store('knowledge-base', 'public');
            $data['file_path'] = $path;
            $data['file_type'] = $file->getClientOriginalExtension();
        }

        return $kb->documents()->create($data);
    }

    /**
     * Update an existing document.
     */
    public function updateDocument(KnowledgeDocument $document, array $data, ?UploadedFile $file = null): KnowledgeDocument
    {
        if ($file) {
            // Delete old file
            if ($document->file_path) {
                Storage::disk('public')->delete($document->file_path);
            }
            $path = $file->store('knowledge-base', 'public');
            $data['file_path'] = $path;
            $data['file_type'] = $file->getClientOriginalExtension();
        }

        $document->update($data);
        return $document->fresh();
    }

    /**
     * Delete a document and its file.
     */
    public function deleteDocument(KnowledgeDocument $document): bool
    {
        if ($document->file_path) {
            Storage::disk('public')->delete($document->file_path);
        }

        return $document->delete();
    }

    /**
     * Get all documents for a knowledge base.
     */
    public function getDocuments(KnowledgeBase $kb, ?string $category = null, ?string $status = null): \Illuminate\Database\Eloquent\Builder
    {
        $query = $kb->documents();

        if ($category) {
            $query->where('category', $category);
        }
        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Bulk import content from text.
     */
    public function importFromText(KnowledgeBase $kb, string $title, string $content, string $category = 'custom', array $tags = []): KnowledgeDocument
    {
        return $kb->documents()->create([
            'title' => $title,
            'content' => $content,
            'category' => $category,
            'tags' => $tags,
            'status' => 'active',
        ]);
    }
}
