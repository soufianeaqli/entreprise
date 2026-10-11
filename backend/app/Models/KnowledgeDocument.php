<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeDocument extends Model
{
    use HasFactory;

    protected $table = 'knowledge_documents';

    protected $fillable = [
        'knowledge_base_id',
        'title',
        'content',
        'category',
        'tags',
        'file_path',
        'file_type',
        'access_role',
        'status',
        'usage_count',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function knowledgeBase(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBase::class);
    }

    public function isAccessibleBy(string $role): bool
    {
        if ($this->access_role === 'all') return true;

        $accessMap = [
            'super_admin' => ['super_admin', 'admin'],
            'rh' => ['super_admin', 'rh'],
            'candidate' => ['super_admin', 'rh', 'candidate'],
        ];

        $allowed = $accessMap[$role] ?? [$role];
        return in_array($this->access_role, $allowed);
    }

    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }
}
