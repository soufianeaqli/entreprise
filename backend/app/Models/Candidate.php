<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Candidate extends Model
{
    use HasFactory;

    const STATUSES = [
        'new' => 'Nouvelle candidature',
        'cv_review' => 'CV en cours d\'analyse',
        'interview_scheduled' => 'Entretien programmé',
        'technical_test' => 'Test technique',
        'final_interview' => 'Entretien final',
        'accepted' => 'Accepté',
        'rejected' => 'Refusé',
    ];

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'cin',
        'birth_date',
        'gender',
        'address',
        'photo',
        'recruitment_id',
        'department_id',
        'cover_letter',
        'cv_file',
        'status',
        'notes',
        'interview_date',
        'interview_time',
        'interview_notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'interview_date' => 'date',
    ];

    public function recruitment(): BelongsTo
    {
        return $this->belongsTo(Recruitment::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function profile()
    {
        return $this->hasOneThrough(
            \App\Models\CandidateProfile::class,
            \App\Models\User::class,
            'id',
            'user_id',
            'user_id',
            'id'
        );
    }

    public function documents()
    {
        return $this->hasManyThrough(
            \App\Models\CandidateDocument::class,
            \App\Models\User::class,
            'id',
            'user_id',
            'user_id',
            'id'
        );
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }
}
