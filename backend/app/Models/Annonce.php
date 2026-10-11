<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Annonce extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'department',
        'location',
        'type',
        'salary',
        'description',
        'status',
        'applications',
        'posted_date',
        'deadline',
    ];

    protected $casts = [
        'applications' => 'integer',
        'posted_date' => 'date',
        'deadline' => 'date',
    ];
}
