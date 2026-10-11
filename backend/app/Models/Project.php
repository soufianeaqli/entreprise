<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'client',
        'description',
        'budget',
        'start_date',
        'end_date',
        'manager',
        'status',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function incomes(): HasMany
    {
        return $this->hasMany(ProjectIncome::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(ProjectExpense::class);
    }

    public function getTotalIncomesAttribute(): float
    {
        return (float) $this->incomes()->sum('amount');
    }

    public function getTotalExpensesAttribute(): float
    {
        return (float) $this->expenses()->sum('amount');
    }

    public function getResultAttribute(): float
    {
        return $this->total_incomes - $this->total_expenses;
    }

    public function getRemainingBudgetAttribute(): float
    {
        return (float) $this->budget - $this->total_incomes;
    }

    public function getProfitabilityRateAttribute(): float
    {
        if ($this->total_incomes <= 0) return 0;
        return round(($this->result / $this->total_incomes) * 100, 1);
    }
}
