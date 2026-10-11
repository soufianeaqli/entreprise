<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recruitment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('status', [
                'new',
                'cv_review',
                'interview_scheduled',
                'technical_test',
                'final_interview',
                'accepted',
                'rejected',
            ])->default('new');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'recruitment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_applications');
    }
};
