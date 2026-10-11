<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AIExecution extends Model
{
    use HasFactory;

    protected $table = 'ai_executions';

    protected $fillable = [
        'user_id',
        'question',
        'plan',
        'result',
        'tools_used',
        'status',
        'duration_ms',
        'error',
    ];

    protected $casts = [
        'plan' => 'array',
        'result' => 'array',
        'tools_used' => 'array',
        'duration_ms' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Durée formatée en ms.
     */
    public function getDurationFormattedAttribute(): string
    {
        if ($this->duration_ms < 1000) {
            return round($this->duration_ms, 0) . 'ms';
        }
        return round($this->duration_ms / 1000, 2) . 's';
    }
}
