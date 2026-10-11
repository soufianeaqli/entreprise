<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'type',
        'department_id',
        'rh_manager_id',
        'date',
        'start_time',
        'end_time',
        'location',
        'meeting_link',
        'priority',
        'status',
        'minutes_summary',
        'minutes_objective',
        'minutes_key_points',
        'minutes_notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function rhManager(): BelongsTo
    {
        return $this->belongsTo(RhManager::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(RhManager::class, 'meeting_participants')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function decisions(): HasMany
    {
        return $this->hasMany(MeetingDecision::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(MeetingTask::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MeetingAttachment::class);
    }
}
