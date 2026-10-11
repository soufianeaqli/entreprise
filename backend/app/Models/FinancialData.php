<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialData extends Model
{
    use HasFactory;

    protected $table = 'financial_data';

    protected $fillable = [
        'month',
        'revenue',
        'expenses',
    ];

    protected $casts = [
        'revenue' => 'integer',
        'expenses' => 'integer',
    ];
}
