<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'role',
        'title',
        'message',
        'type',
        'link',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getTimeAgoAttribute(): string
    {
        $diff = now()->diffInSeconds($this->created_at);

        if ($diff < 60) return "À l'instant";
        if ($diff < 3600) return 'Il y a ' . floor($diff / 60) . ' min';
        if ($diff < 86400) return 'Il y a ' . floor($diff / 3600) . 'h';
        if ($diff < 604800) return 'Il y a ' . floor($diff / 86400) . 'j';

        return $this->created_at->format('d/m/Y');
    }
}
