<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidateApplication extends Model
{
    use HasFactory;

    const STATUSES = [
        'new' => 'Candidature envoyée',
        'cv_review' => 'CV en cours d\'analyse',
        'interview_scheduled' => 'Entretien programmé',
        'technical_test' => 'Test technique',
        'final_interview' => 'Entretien final',
        'accepted' => 'Accepté',
        'rejected' => 'Refusé',
    ];

    protected $fillable = [
        'user_id',
        'recruitment_id',
        'department_id',
        'status',
        'notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recruitment(): BelongsTo
    {
        return $this->belongsTo(Recruitment::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }
}
