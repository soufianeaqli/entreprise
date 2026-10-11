<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeetingTask extends Model
{
    use HasFactory;

    protected $fillable = ['meeting_id', 'title', 'description', 'assigned_to', 'due_date', 'priority', 'status'];

    protected $casts = [
        'due_date' => 'date',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(RhManager::class, 'assigned_to');
    }
}
