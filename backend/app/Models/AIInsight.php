<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIInsight extends Model
{
    use HasFactory;

    protected $table = 'ai_insights';

    protected $fillable = [
        'rule',
        'title',
        'description',
        'severity',
        'category',
        'actions',
        'metadata',
        'status',
    ];

    protected $casts = [
        'actions' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Scope: only new insights.
     */
    public function scopeNew($query)
    {
        return $query->where('status', 'new');
    }

    /**
     * Scope: non-dismissed.
     */
    public function scopeActive($query)
    {
        return $query->where('status', '!=', 'dismissed');
    }

    /**
     * Mark as acknowledged.
     */
    public function acknowledge(): void
    {
        $this->update(['status' => 'acknowledged']);
    }

    /**
     * Mark as dismissed.
     */
    public function dismiss(): void
    {
        $this->update(['status' => 'dismissed']);
    }
}
