<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('recruitments');

        Schema::create('recruitments', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('rh_manager_id')->nullable()->constrained('rh_managers')->nullOnDelete();
            $table->string('contract_type')->default('CDI');
            $table->string('location')->nullable();
            $table->enum('work_mode', ['presentiel', 'hybride', 'teletravail'])->default('presentiel');
            $table->integer('positions_count')->default(1);
            $table->string('experience_level')->nullable();
            $table->string('education_level')->nullable();
            $table->decimal('salary', 10, 2)->nullable();
            $table->date('posted_date')->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status', ['draft', 'published', 'closed', 'archived'])->default('draft');
            $table->text('description')->nullable();
            $table->text('missions')->nullable();
            $table->text('skills')->nullable();
            $table->text('qualifications')->nullable();
            $table->text('benefits')->nullable();
            $table->text('additional_info')->nullable();
            $table->integer('applications_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recruitments');
    }
};
