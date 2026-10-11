<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->enum('status', [
                'new',
                'cv_review',
                'interview_scheduled',
                'technical_test',
                'final_interview',
                'accepted',
                'rejected',
            ])->default('new')->change();
        });
    }

    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->enum('status', [
                'new',
                'reviewing',
                'interview',
                'accepted',
                'rejected',
            ])->default('new')->change();
        });
    }
};
