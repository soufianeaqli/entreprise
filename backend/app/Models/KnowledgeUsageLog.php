<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeUsageLog extends Model
{
    use HasFactory;

    protected $table = 'knowledge_usage_logs';

    protected $fillable = [
        'document_id',
        'user_id',
        'question',
        'relevance_score',
    ];

    protected $casts = [
        'relevance_score' => 'float',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(KnowledgeDocument::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
