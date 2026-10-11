<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->json('plan')->nullable();
            $table->json('result')->nullable();
            $table->json('tools_used')->nullable();
            $table->enum('status', ['completed', 'partial', 'failed', 'cancelled'])->default('completed');
            $table->float('duration_ms')->default(0);
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_executions');
    }
};
