<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recruitment extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'department_id',
        'rh_manager_id',
        'contract_type',
        'location',
        'work_mode',
        'positions_count',
        'experience_level',
        'education_level',
        'salary',
        'posted_date',
        'deadline',
        'status',
        'description',
        'missions',
        'skills',
        'qualifications',
        'benefits',
        'additional_info',
        'applications_count',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'posted_date' => 'date',
        'deadline' => 'date',
        'positions_count' => 'integer',
        'applications_count' => 'integer',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function rhManager(): BelongsTo
    {
        return $this->belongsTo(RhManager::class);
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(Candidate::class);
    }
}
