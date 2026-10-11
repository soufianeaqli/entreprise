<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'rh_manager_id',
        'employee_name',
        'type',
        'department',
        'start_date',
        'end_date',
        'salary',
        'status',
        'trial_period',
        'work_hours',
        'leave_days',
        'benefits',
        'observations',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'salary' => 'decimal:2',
        'leave_days' => 'integer',
    ];

    public function rhManager(): BelongsTo
    {
        return $this->belongsTo(RhManager::class);
    }
}
