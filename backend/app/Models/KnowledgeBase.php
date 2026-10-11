<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeBase extends Model
{
    use HasFactory;

    protected $table = 'knowledge_bases';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'status',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(KnowledgeDocument::class, 'knowledge_base_id');
    }

    public function activeDocuments(): HasMany
    {
        return $this->documents()->where('status', 'active');
    }

    public function getDocumentsCountAttribute(): int
    {
        return $this->documents()->count();
    }
}
