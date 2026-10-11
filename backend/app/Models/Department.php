<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'rh_manager_id',
        'location',
        'annual_budget',
        'employees_count',
        'status',
    ];

    protected $casts = [
        'annual_budget' => 'decimal:2',
        'employees_count' => 'integer',
        'status' => 'boolean',
    ];

    public function rhManager(): BelongsTo
    {
        return $this->belongsTo(RhManager::class);
    }
}
