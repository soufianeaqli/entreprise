<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();
            $table->string('rule')->index();
            $table->string('title');
            $table->text('description');
            $table->enum('severity', ['critical', 'warning', 'info', 'success'])->default('info');
            $table->enum('category', ['contract', 'recruitment', 'employee', 'rh', 'meeting', 'budget']);
            $table->json('actions')->nullable();
            $table->json('metadata')->nullable();
            $table->enum('status', ['new', 'acknowledged', 'dismissed'])->default('new');
            $table->timestamps();

            $table->index('severity');
            $table->index('category');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_insights');
    }
};
