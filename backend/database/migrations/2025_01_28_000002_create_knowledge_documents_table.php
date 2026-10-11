<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('knowledge_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('knowledge_base_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->longText('content');
            $table->enum('category', ['company', 'regulations', 'app_usage', 'faq', 'custom'])->default('custom');
            $table->json('tags')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_type')->nullable();
            $table->string('access_role')->default('all');
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();

            $table->index('category');
            $table->index('status');
            $table->index('access_role');
            $table->index('knowledge_base_id');

            // Full-text index for search
            $table->fullText(['title', 'content']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_documents');
    }
};
