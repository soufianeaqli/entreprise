<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annonces', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('department');
            $table->string('location')->nullable();
            $table->string('type')->default('CDI');
            $table->string('salary')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['published', 'draft', 'archived'])->default('draft');
            $table->integer('applications')->default(0);
            $table->date('posted_date')->nullable();
            $table->date('deadline')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annonces');
    }
};
